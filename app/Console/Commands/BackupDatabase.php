<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database';
    protected $description = 'Backup the database';

    public function handle()
    {
        $backupDir = storage_path('backups');
        if (!is_dir($backupDir)) mkdir($backupDir, 0755, true);
        
        $timestamp = now()->format('Ymd_His');
        $filename = "mtai_backup_{$timestamp}.sql.gz";
        $filepath = "{$backupDir}/{$filename}";
        
        $host = config('database.connections.mysql.host');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        
        $command = "mysqldump -h {$host} -u {$username} -p{$password} {$database} | gzip > {$filepath}";
        
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info("Backup created: {$filename}");
            // Clean old backups (keep 30 days)
            $files = glob("{$backupDir}/mtai_backup_*.sql.gz");
            foreach ($files as $file) {
                if (filemtime($file) < now()->subDays(30)->timestamp) {
                    unlink($file);
                }
            }
        } else {
            $this->error("Backup failed");
            return 1;
        }
        
        return 0;
    }
}
