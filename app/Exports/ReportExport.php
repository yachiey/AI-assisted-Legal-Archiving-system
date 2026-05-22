<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ReportExport implements WithMultipleSheets
{
    protected $stats;
    protected $documentsByCategory;
    protected $detailedDocuments;
    protected $recentActivity;
    protected $reportType;
    protected $format;

    public function __construct($stats, $documentsByCategory, $detailedDocuments, $recentActivity, $reportType = 'general', $format = 'excel')
    {
        $this->stats = $stats;
        $this->documentsByCategory = $documentsByCategory;
        $this->detailedDocuments = $detailedDocuments;
        $this->recentActivity = $recentActivity;
        $this->reportType = $reportType;
        $this->format = $format;
    }

    public function sheets(): array
    {
        // For CSV, we only return the Detailed Documents sheet for better data utility
        if ($this->format === 'csv') {
            return [
                new DetailedDocumentsSheet($this->detailedDocuments, $this->format)
            ];
        }

        // For Excel, we return all sheets with professional styling
        return [
            new SummarySheet($this->stats, $this->reportType),
            new DetailedDocumentsSheet($this->detailedDocuments, $this->format),
            new DocumentsByCategorySheet($this->documentsByCategory),
            new RecentActivitySheet($this->recentActivity),
        ];
    }
}

/**
 * Base class for styled sheets to share header logic
 */
abstract class BaseStyledSheet implements FromCollection, WithHeadings, WithStyles, WithTitle, WithColumnWidths, WithCustomStartCell
{
    protected $format;

    public function startCell(): string
    {
        return $this->format === 'csv' ? 'A1' : 'A6';
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
        $sheet->setCellValue('A2', 'Secure. Organized. Compliant.');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['italic' => true, 'size' => 10, 'color' => ['rgb' => '6B7280']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // 2. Report Metadata
        $sheet->setCellValue('A4', 'REPORT TYPE:');
        $sheet->setCellValue('B4', strtoupper($this->title()));
        $sheet->getStyle('A4')->getFont()->setBold(true);

        $sheet->setCellValue('C4', 'GENERATED ON:');
        $sheet->setCellValue('D4', date('Y-m-d H:i A'));
        $sheet->getStyle('C4')->getFont()->setBold(true);

        // 3. Data Header Styling (Starts at Row 6)
        $headerRange = "A6:{$highestColumn}6";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1A1A1A'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
            ],
        ]);

        // Add a bottom border to the header row (Green)
        $sheet->getStyle($headerRange)->applyFromArray([
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color' => ['rgb' => '059669'],
                ],
            ],
        ]);

        // 4. Content Styling
        $contentRange = "A7:{$highestColumn}{$highestRow}";
        
        // Alternating Row Colors
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

        // Add thin borders to all data cells
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
}

class SummarySheet extends BaseStyledSheet
{
    protected $stats;
    protected $reportType;

    public function __construct($stats, $reportType, $format = 'excel')
    {
        $this->stats = $stats;
        $this->reportType = $reportType;
        $this->format = $format;
    }

    public function collection()
    {
        return collect([
            ['Total Documents', $this->stats['totalDocuments']],
            ['Documents This Month', $this->stats['documentsThisMonth']],
            ['Documents This Week', $this->stats['documentsThisWeek']],
            ['Active Users', $this->stats['activeUsers']],
        ]);
    }

    public function headings(): array
    {
        return ['Metric', 'Value'];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 30,
            'B' => 20,
        ];
    }

    public function title(): string
    {
        return 'Executive Summary';
    }
}

class DetailedDocumentsSheet extends BaseStyledSheet
{
    protected $documents;

    public function __construct($documents, $format = 'excel')
    {
        $this->documents = $documents;
        $this->format = $format;
    }

    public function collection()
    {
        return $this->documents;
    }

    public function headings(): array
    {
        return [
            'Document ID',
            'Title',
            'Folder',
            'Created By',
            'Created At',
            'Description',
            'Physical Location'
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15,
            'B' => 40,
            'C' => 20,
            'D' => 25,
            'E' => 20,
            'F' => 50,
            'G' => 25,
        ];
    }

    public function title(): string
    {
        return 'Detailed Document List';
    }
}

class DocumentsByCategorySheet extends BaseStyledSheet
{
    protected $documentsByCategory;

    public function __construct($documentsByCategory, $format = 'excel')
    {
        $this->documentsByCategory = $documentsByCategory;
        $this->format = $format;
    }

    public function collection()
    {
        return collect($this->documentsByCategory)->map(function ($item) {
            return [
                'folder' => $item['category'],
                'count' => $item['count'],
                'percentage' => $item['percentage'] . '%',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Folder Name',
            'Document Count',
            'Percentage'
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 35,
            'B' => 20,
            'C' => 15,
        ];
    }

    public function title(): string
    {
        return 'Distribution Analysis';
    }
}

class RecentActivitySheet extends BaseStyledSheet
{
    protected $recentActivity;

    public function __construct($recentActivity, $format = 'excel')
    {
        $this->recentActivity = $recentActivity;
        $this->format = $format;
    }

    public function collection()
    {
        return collect($this->recentActivity);
    }

    public function headings(): array
    {
        return [
            'Action',
            'Document',
            'User',
            'Time'
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25,
            'B' => 40,
            'C' => 30,
            'D' => 20,
        ];
    }

    public function title(): string
    {
        return 'Recent Activity Logs';
    }
}
