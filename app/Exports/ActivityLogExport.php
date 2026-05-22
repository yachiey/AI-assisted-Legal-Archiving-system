<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ActivityLogExport implements FromCollection, WithHeadings, WithStyles, WithTitle, WithColumnWidths, WithCustomStartCell
{
    protected $activityLogs;
    protected $format;

    public function __construct($activityLogs, $format = 'excel')
    {
        $this->activityLogs = $activityLogs;
        $this->format = $format;
    }

    public function startCell(): string
    {
        return $this->format === 'csv' ? 'A1' : 'A6';
    }

    public function collection()
    {
        return collect($this->activityLogs)->map(function ($log) {
            return [
                'activity_type' => $log['activity_type'],
                'document' => $log['document'],
                'user' => $log['user'],
                'time' => $log['time'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Activity Type',
            'Document Name',
            'User',
            'Date & Time'
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25,
            'B' => 45,
            'C' => 30,
            'D' => 20,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        if ($this->format === 'csv') {
            return [];
        }

        $highestColumn = $sheet->getHighestColumn();
        $highestRow = $sheet->getHighestRow();

        // 1. Company Branding
        $sheet->mergeCells("A1:{$highestColumn}1");
        $sheet->setCellValue('A1', 'LEGAL DOCUMENT MANAGEMENT SYSTEM');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '059669']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->mergeCells("A2:{$highestColumn}2");
        $sheet->setCellValue('A2', 'Official Activity Logs Report');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '6B7280']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // 2. Metadata
        $sheet->setCellValue('A4', 'GENERATED ON:');
        $sheet->setCellValue('B4', date('Y-m-d H:i A'));
        $sheet->getStyle('A4')->getFont()->setBold(true);

        $sheet->setCellValue('C4', 'TOTAL LOGS:');
        $sheet->setCellValue('D4', count($this->activityLogs));
        $sheet->getStyle('C4')->getFont()->setBold(true);

        // 3. Header Styling
        $headerRange = "A6:{$highestColumn}6";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1A1A1A'],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);

        // Green border under header
        $sheet->getStyle($headerRange)->applyFromArray([
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color' => ['rgb' => '059669'],
                ],
            ],
        ]);

        // 4. Content Styling
        for ($i = 7; $i <= $highestRow; $i++) {
            if ($i % 2 == 0) {
                $sheet->getStyle("A{$i}:{$highestColumn}{$i}")->applyFromArray([
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F9FAFB'],
                    ],
                ]);
            }
        }

        // Borders for all cells
        $sheet->getStyle("A6:{$highestColumn}{$highestRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
        ]);

        return [];
    }

    public function title(): string
    {
        return 'Activity Logs';
    }
}
