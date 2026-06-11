package main

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"time"

	_ "modernc.org/sqlite"
)

const deviceAccountVaultKey = "monviewphone:device-account-vault"

type accountNotice struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	DueDate   *int64 `json:"dueDate"`
	Days      *int   `json:"days,omitempty"`
	StartDate *int64 `json:"startDate"`
}

type deviceAccount struct {
	ID                  string         `json:"id"`
	Name                string         `json:"name"`
	Nickname            string         `json:"nickname"`
	Phone               string         `json:"phone"`
	Email               string         `json:"email"`
	Note                string         `json:"note"`
	Status              string         `json:"status"`
	Notice              *accountNotice `json:"notice"`
	AppType             string         `json:"appType,omitempty"`
	CreatedAt           *int64         `json:"createdAt"`
	VerifyStatus        string         `json:"verifyStatus"`
	PhoneRegion         string         `json:"phoneRegion"`
	ScanCount           int            `json:"scanCount"`
	LastScanDate        *int64         `json:"lastScanDate"`
	NearbyPeopleEnabled bool           `json:"nearbyPeopleEnabled"`
	NearbyPeopleDueDate *int64         `json:"nearbyPeopleDueDate"`
	ImportedFrom        string         `json:"importedFrom,omitempty"`
	DashboardAccountID  *int           `json:"dashboardAccountId,omitempty"`
	DashboardCardName   string         `json:"dashboardCardName,omitempty"`
	DashboardCardID     *int           `json:"dashboardCardId,omitempty"`
}

type deviceAccountData struct {
	UDID                      string                     `json:"udid"`
	DisplayName               string                     `json:"displayName"`
	DefaultPlatform           string                     `json:"defaultPlatform"`
	SelectedAccountByPlatform map[string]string          `json:"selectedAccountByPlatform"`
	Platforms                 map[string][]deviceAccount `json:"platforms"`
	UpdatedAt                 int64                      `json:"updatedAt"`
}

type deviceAccountVault struct {
	Version int                          `json:"version"`
	Devices map[string]deviceAccountData `json:"devices"`
}

func deviceAccountDBPath() string {
	return filepath.Join(".", "data", "Data.db")
}

func openDeviceAccountDB() (*sql.DB, error) {
	if err := os.MkdirAll(filepath.Dir(deviceAccountDBPath()), 0755); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", deviceAccountDBPath())
	if err != nil {
		return nil, err
	}
	if err := initDeviceAccountDB(db); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

func initDeviceAccountDB(db *sql.DB) error {
	_, err := db.Exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA foreign_keys = ON;
		CREATE TABLE IF NOT EXISTS devices (
			udid TEXT PRIMARY KEY,
			device_order INTEGER,
			display_name TEXT,
			created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS accounts (
			id TEXT PRIMARY KEY,
			udid TEXT NOT NULL,
			platform TEXT NOT NULL,
			name TEXT,
			nickname TEXT,
			phone TEXT,
			email TEXT,
			note TEXT,
			status TEXT NOT NULL DEFAULT 'Live',
			app_type TEXT,
			notice_json TEXT,
			created_at_ms INTEGER,
			verify_status TEXT,
			phone_region TEXT,
			scan_count INTEGER NOT NULL DEFAULT 0,
			last_scan_date_ms INTEGER,
			nearby_people_enabled INTEGER NOT NULL DEFAULT 0,
			nearby_people_due_date_ms INTEGER,
			source TEXT,
			source_account_id TEXT,
			source_card_name TEXT,
			source_card_id TEXT,
			imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (udid) REFERENCES devices(udid) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_accounts_udid_platform ON accounts(udid, platform);
		CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_source ON accounts(source, source_account_id);
	`)
	return err
}

func sqlNullString(value string) sql.NullString {
	if value == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: value, Valid: true}
}

func sqlNullInt64(value *int64) sql.NullInt64 {
	if value == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: *value, Valid: true}
}

func nullableString(value sql.NullString) string {
	if value.Valid {
		return value.String
	}
	return ""
}

func nullableInt64(value sql.NullInt64) *int64 {
	if !value.Valid {
		return nil
	}
	out := value.Int64
	return &out
}

func syncDeviceAccountVaultToDB(raw string) error {
	if raw == "" {
		return nil
	}

	var vault deviceAccountVault
	if err := json.Unmarshal([]byte(raw), &vault); err != nil {
		return err
	}
	if vault.Devices == nil {
		vault.Devices = map[string]deviceAccountData{}
	}

	db, err := openDeviceAccountDB()
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM accounts"); err != nil {
		return err
	}
	if _, err := tx.Exec("DELETE FROM devices"); err != nil {
		return err
	}

	insertDevice, err := tx.Prepare(`
		INSERT INTO devices (udid, display_name, updated_at)
		VALUES (?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(udid) DO UPDATE SET display_name = excluded.display_name, updated_at = CURRENT_TIMESTAMP
	`)
	if err != nil {
		return err
	}
	defer insertDevice.Close()

	insertAccount, err := tx.Prepare(`
		INSERT INTO accounts (
			id, udid, platform, name, nickname, phone, email, note, status, app_type,
			notice_json, created_at_ms, verify_status, phone_region, scan_count,
			last_scan_date_ms, nearby_people_enabled, nearby_people_due_date_ms,
			source, source_account_id, source_card_name, source_card_id, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	`)
	if err != nil {
		return err
	}
	defer insertAccount.Close()

	for udid, device := range vault.Devices {
		if udid == "" {
			udid = device.UDID
		}
		if udid == "" {
			continue
		}
		if _, err := insertDevice.Exec(udid, device.DisplayName); err != nil {
			return err
		}
		for platform, accounts := range device.Platforms {
			for _, account := range accounts {
				if account.ID == "" {
					continue
				}
				noticeJSON := sql.NullString{}
				if account.Notice != nil {
					bytes, err := json.Marshal(account.Notice)
					if err != nil {
						return err
					}
					noticeJSON = sql.NullString{String: string(bytes), Valid: true}
				}
				var dashboardAccountID sql.NullString
				if account.DashboardAccountID != nil {
					dashboardAccountID = sql.NullString{String: strconv.Itoa(*account.DashboardAccountID), Valid: true}
				}
				var dashboardCardID sql.NullString
				if account.DashboardCardID != nil {
					dashboardCardID = sql.NullString{String: strconv.Itoa(*account.DashboardCardID), Valid: true}
				}
				if _, err := insertAccount.Exec(
					account.ID,
					udid,
					platform,
					account.Name,
					account.Nickname,
					account.Phone,
					account.Email,
					account.Note,
					account.Status,
					sqlNullString(account.AppType),
					noticeJSON,
					sqlNullInt64(account.CreatedAt),
					sqlNullString(account.VerifyStatus),
					sqlNullString(account.PhoneRegion),
					account.ScanCount,
					sqlNullInt64(account.LastScanDate),
					boolToInt(account.NearbyPeopleEnabled),
					sqlNullInt64(account.NearbyPeopleDueDate),
					sqlNullString(account.ImportedFrom),
					dashboardAccountID,
					sqlNullString(account.DashboardCardName),
					dashboardCardID,
				); err != nil {
					return err
				}
			}
		}
	}

	return tx.Commit()
}

func boolToInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func loadDeviceAccountVaultFromDB() (string, bool, error) {
	db, err := openDeviceAccountDB()
	if err != nil {
		return "", false, err
	}
	defer db.Close()

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM accounts").Scan(&count); err != nil {
		return "", false, err
	}
	if count == 0 {
		return "", false, nil
	}

	rows, err := db.Query(`
		SELECT
			a.id, a.udid, a.platform, a.name, a.nickname, a.phone, a.email, a.note, a.status,
			a.app_type, a.notice_json, a.created_at_ms, a.verify_status, a.phone_region,
			a.scan_count, a.last_scan_date_ms, a.nearby_people_enabled, a.nearby_people_due_date_ms,
			a.source, a.source_account_id, a.source_card_name, a.source_card_id,
			d.display_name
		FROM accounts a
		LEFT JOIN devices d ON d.udid = a.udid
		ORDER BY d.device_order ASC, a.platform ASC, a.imported_at ASC, a.id ASC
	`)
	if err != nil {
		return "", false, err
	}
	defer rows.Close()

	vault := deviceAccountVault{Version: 1, Devices: map[string]deviceAccountData{}}
	now := time.Now().UnixMilli()

	for rows.Next() {
		var (
			id, udid, platform, name, nickname, phone, email, note, status string
			appType, noticeRaw, verifyStatus, phoneRegion                  sql.NullString
			createdAt, lastScanDate, nearbyPeopleDueDate                   sql.NullInt64
			scanCount, nearbyPeopleEnabled                                 int
			source, sourceAccountID, sourceCardName, sourceCardID          sql.NullString
			displayName                                                    sql.NullString
		)
		if err := rows.Scan(
			&id, &udid, &platform, &name, &nickname, &phone, &email, &note, &status,
			&appType, &noticeRaw, &createdAt, &verifyStatus, &phoneRegion,
			&scanCount, &lastScanDate, &nearbyPeopleEnabled, &nearbyPeopleDueDate,
			&source, &sourceAccountID, &sourceCardName, &sourceCardID,
			&displayName,
		); err != nil {
			return "", false, err
		}

		device := vault.Devices[udid]
		if device.UDID == "" {
			device = deviceAccountData{
				UDID:                      udid,
				DisplayName:               nullableString(displayName),
				DefaultPlatform:           "wechat",
				SelectedAccountByPlatform: map[string]string{},
				Platforms:                 map[string][]deviceAccount{},
				UpdatedAt:                 now,
			}
		}
		if device.Platforms == nil {
			device.Platforms = map[string][]deviceAccount{}
		}
		for _, key := range []string{"wechat", "line", "tantan", "telegram", "other"} {
			if device.Platforms[key] == nil {
				device.Platforms[key] = []deviceAccount{}
			}
		}

		var notice *accountNotice
		if noticeRaw.Valid && noticeRaw.String != "" {
			parsed := accountNotice{}
			if err := json.Unmarshal([]byte(noticeRaw.String), &parsed); err == nil {
				notice = &parsed
			}
		}

		account := deviceAccount{
			ID:                  id,
			Name:                name,
			Nickname:            nickname,
			Phone:               phone,
			Email:               email,
			Note:                note,
			Status:              status,
			Notice:              notice,
			AppType:             nullableString(appType),
			CreatedAt:           nullableInt64(createdAt),
			VerifyStatus:        nullableString(verifyStatus),
			PhoneRegion:         nullableString(phoneRegion),
			ScanCount:           scanCount,
			LastScanDate:        nullableInt64(lastScanDate),
			NearbyPeopleEnabled: nearbyPeopleEnabled == 1,
			NearbyPeopleDueDate: nullableInt64(nearbyPeopleDueDate),
			ImportedFrom:        nullableString(source),
			DashboardCardName:   nullableString(sourceCardName),
		}
		if sourceAccountID.Valid {
			if value, err := strconv.Atoi(sourceAccountID.String); err == nil {
				account.DashboardAccountID = &value
			}
		}
		if sourceCardID.Valid {
			if value, err := strconv.Atoi(sourceCardID.String); err == nil {
				account.DashboardCardID = &value
			}
		}

		device.Platforms[platform] = append(device.Platforms[platform], account)
		if device.SelectedAccountByPlatform == nil {
			device.SelectedAccountByPlatform = map[string]string{}
		}
		if device.SelectedAccountByPlatform[platform] == "" {
			device.SelectedAccountByPlatform[platform] = id
		}
		vault.Devices[udid] = device
	}
	if err := rows.Err(); err != nil {
		return "", false, err
	}

	bytes, err := json.Marshal(vault)
	if err != nil {
		return "", false, err
	}
	return string(bytes), true, nil
}
