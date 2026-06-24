using System;
using System.Diagnostics;
using System.IO;
using System.Text;

class Program {
    static int Main(string[] args) {
        string dir = AppDomain.CurrentDomain.BaseDirectory;
        string real = Path.Combine(dir, "adb_real.exe");
        string log = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "xiaowei_adb_wrapper.log");

        string line = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + " | " + dir + "adb.exe " + string.Join(" ", args);
        File.AppendAllText(log, line + Environment.NewLine, Encoding.UTF8);

        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = real;
        psi.Arguments = BuildArgs(args);
        psi.UseShellExecute = false;
        psi.CreateNoWindow = true;

        Process p = Process.Start(psi);
        p.WaitForExit();
        return p.ExitCode;
    }

    static string BuildArgs(string[] args) {
        StringBuilder sb = new StringBuilder();
        foreach (string arg in args) {
            if (sb.Length > 0) sb.Append(" ");
            sb.Append(QuoteArg(arg));
        }
        return sb.ToString();
    }

    static string QuoteArg(string arg) {
        if (arg == null || arg.Length == 0) return "\"\"";
        bool needQuote = arg.IndexOfAny(new char[] {' ', '\t', '\n', '\v', '"'}) >= 0;
        if (!needQuote) return arg;

        StringBuilder sb = new StringBuilder();
        sb.Append('"');
        int backslashes = 0;

        foreach (char c in arg) {
            if (c == '\\') {
                backslashes++;
            } else if (c == '"') {
                sb.Append('\\', backslashes * 2 + 1);
                sb.Append('"');
                backslashes = 0;
            } else {
                sb.Append('\\', backslashes);
                backslashes = 0;
                sb.Append(c);
            }
        }

        sb.Append('\\', backslashes * 2);
        sb.Append('"');
        return sb.ToString();
    }
}
