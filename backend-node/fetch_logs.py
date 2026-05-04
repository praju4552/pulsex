import paramiko
import sys

host = '193.203.162.246'
port = 65002
user = 'u360799757'
password = 'EdmalaB@2025'

def run_ssh_command(command):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(hostname=host, port=port, username=user, password=password, timeout=10)
        stdin, stdout, stderr = client.exec_command(command)
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        if out:
            print("--- STDOUT ---")
            print(out)
        if err:
            print("--- STDERR ---")
            print(err)
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    commands = [
        "cat ~/domains/pulsewritexsolutions.com/passenger.log | tail -n 50",
        "cat ~/domains/pulsewritexsolutions.com/logs/error_log | tail -n 50",
        "cat ~/domains/pulsewritexsolutions.com/public_html/error_log.txt | tail -n 50",
        "ls -la ~/domains/pulsewritexsolutions.com/",
        "ls -la ~/domains/api.pulsewritexsolutions.com/"
    ]
    for cmd in commands:
        print(f"\n====================\nRunning: {cmd}")
        run_ssh_command(cmd)
