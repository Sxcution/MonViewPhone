package websocket

import (
	"encoding/binary"
	"time"
)

const (
	ctrlKeycode         = 0
	ctrlText            = 1
	ctrlTouch           = 2
	ctrlScroll          = 3
	ctrlGetClipboard    = 8
	ctrlSetClipboard    = 9
	ctrlSetDisplayPower = 10
)

const (
	motionDown = 0
	motionUp   = 1
	motionMove = 2

	buttonPrimary = 1
)

func beU16(b []byte, off int) uint16 {
	return binary.BigEndian.Uint16(b[off : off+2])
}

func beU32(b []byte, off int) uint32 {
	return binary.BigEndian.Uint32(b[off : off+4])
}

func putU16(out []byte, off int, v uint16) {
	binary.BigEndian.PutUint16(out[off:off+2], v)
}

func putU32(out []byte, off int, v uint32) {
	binary.BigEndian.PutUint32(out[off:off+4], v)
}

func putU64(out []byte, off int, v uint64) {
	binary.BigEndian.PutUint64(out[off:off+8], v)
}

func encodeScrollAxisFromLegacy(v int32) uint16 {
	if v > 0 {
		return 0x7fff
	}
	if v < 0 {
		return 0x8000
	}
	return 0
}

// Frontend hiện tại gửi control packet kiểu ws6.
// Hàm này convert sang scrcpy v3.3.4 control protocol.
func translateLegacyControlToScrcpy334(in []byte) ([]byte, bool) {
	if len(in) == 0 {
		return nil, false
	}

	switch in[0] {
	case ctrlKeycode:
		// v3.3.4 keycode vẫn 14 bytes:
		// type(1), action(1), keycode(u32), repeat(u32), meta(u32)
		if len(in) != 14 {
			return nil, false
		}
		out := make([]byte, len(in))
		copy(out, in)
		return out, true

	case ctrlText:
		// type(1), len(u32), utf8 bytes — giữ nguyên.
		if len(in) < 5 {
			return nil, false
		}
		n := int(beU32(in, 1))
		if n < 0 || len(in) != 5+n {
			return nil, false
		}
		out := make([]byte, len(in))
		copy(out, in)
		return out, true

	case ctrlTouch:
		// Legacy MonView/ws6 hiện tại:
		// type(1), action(1), reserved/u32(4), pointerId/u32(4),
		// x/u32, y/u32, w/u16, h/u16, pressure/u16, buttons/u32 = 29 bytes
		//
		// scrcpy v3.3.4:
		// type(1), action(1), pointerId/u64(8),
		// x/u32, y/u32, w/u16, h/u16, pressure/u16,
		// actionButton/u32, buttons/u32 = 32 bytes
		if len(in) != 29 {
			return nil, false
		}

		action := in[1]
		pointerId := beU32(in, 6)
		x := beU32(in, 10)
		y := beU32(in, 14)
		w := beU16(in, 18)
		h := beU16(in, 20)
		pressure := beU16(in, 22)
		buttons := beU32(in, 24)

		actionButton := uint32(0)
		if action == motionDown || action == motionUp {
			actionButton = buttonPrimary
		}
		if buttons == 0 && (action == motionDown || action == motionMove) {
			buttons = buttonPrimary
		}

		out := make([]byte, 32)
		out[0] = ctrlTouch
		out[1] = action
		putU64(out, 2, uint64(pointerId))
		putU32(out, 10, x)
		putU32(out, 14, y)
		putU16(out, 18, w)
		putU16(out, 20, h)
		putU16(out, 22, pressure)
		putU32(out, 24, actionButton)
		putU32(out, 28, buttons)
		return out, true

	case ctrlScroll:
		// Legacy hiện tại trong control.ts:
		// type(1), x/u32, y/u32, w/u16, h/u16, hScroll/i32, vScroll/i32 = 21 bytes
		//
		// scrcpy v3.3.4:
		// type(1), x/u32, y/u32, w/u16, h/u16,
		// hScroll/i16 encoded, vScroll/i16 encoded, buttons/u32 = 21 bytes
		if len(in) != 21 {
			return nil, false
		}

		x := beU32(in, 1)
		y := beU32(in, 5)
		w := beU16(in, 9)
		h := beU16(in, 11)
		hScroll := int32(beU32(in, 13))
		vScroll := int32(beU32(in, 17))

		out := make([]byte, 21)
		out[0] = ctrlScroll
		putU32(out, 1, x)
		putU32(out, 5, y)
		putU16(out, 9, w)
		putU16(out, 11, h)
		putU16(out, 13, encodeScrollAxisFromLegacy(hScroll))
		putU16(out, 15, encodeScrollAxisFromLegacy(vScroll))
		putU32(out, 17, buttonPrimary)
		return out, true

	case ctrlGetClipboard:
		// v3.3.4 expects type + copy_key.
		// Nếu frontend cũ gửi 1 byte thôi thì thêm copy_key=0.
		if len(in) == 1 {
			return []byte{ctrlGetClipboard, 0}, true
		}
		if len(in) == 2 {
			out := make([]byte, 2)
			copy(out, in)
			return out, true
		}
		return nil, false

	case ctrlSetClipboard:
		// Legacy MonView:
		// type(1), paste(1), len(u32), text
		//
		// scrcpy v3.3.4:
		// type(1), sequence/u64, paste(1), len/u32, text
		if len(in) < 6 {
			return nil, false
		}

		paste := in[1]
		n := int(beU32(in, 2))
		if n < 0 || len(in) != 6+n {
			return nil, false
		}

		out := make([]byte, 14+n)
		out[0] = ctrlSetClipboard
		putU64(out, 1, uint64(time.Now().UnixNano()))
		out[9] = paste
		putU32(out, 10, uint32(n))
		copy(out[14:], in[6:])
		return out, true

	case ctrlSetDisplayPower:
		// Legacy: type + mode; MonView dùng OFF=0, NORMAL=2.
		// v3.3.4: type + bool on.
		if len(in) != 2 {
			return nil, false
		}
		on := byte(0)
		if in[1] != 0 {
			on = 1
		}
		return []byte{ctrlSetDisplayPower, on}, true

	default:
		return nil, false
	}
}
