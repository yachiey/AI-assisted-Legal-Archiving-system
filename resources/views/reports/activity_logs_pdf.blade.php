<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }} - {{ date('Y-m-d') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
            padding: 40px;
            max-width: 1000px;
            margin: 0 auto;
        }

        .container {
            background: white;
        }

        .letterhead {
            text-align: center;
            border-bottom: 3px double #059669;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .company-name {
            font-size: 24px;
            font-weight: 700;
            color: #059669;
            letter-spacing: 1px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .company-tagline {
            font-size: 11px;
            color: #6b7280;
            font-style: italic;
        }

        .header {
            margin-bottom: 30px;
        }

        h1 {
            color: #1a1a1a;
            font-size: 20px;
            margin-bottom: 20px;
            font-weight: 700;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            border-bottom: 2px solid #059669;
            padding-bottom: 10px;
        }

        .meta-info {
            display: flex;
            justify-content: space-between;
            color: #4b5563;
            font-size: 10px;
            margin-bottom: 20px;
            padding: 10px 15px;
            background: #f9fafb;
            border-left: 4px solid #059669;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 9px;
            color: #6b7280;
            margin-bottom: 2px;
        }

        .meta-value {
            font-size: 11px;
            color: #1f2937;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border: 1px solid #d1d5db;
            font-size: 10px;
        }

        th {
            background: #1a1a1a;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #059669;
        }

        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
            vertical-align: top;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .action-type {
            font-weight: 600;
            color: #059669;
        }

        .no-data {
            text-align: center;
            padding: 30px;
            color: #9ca3af;
            font-style: italic;
            background: #fafafa;
            border: 1px dashed #d1d5db;
        }

        .footer {
            margin-top: 50px;
            padding-top: 15px;
            border-top: 3px double #059669;
            text-align: center;
            color: #4b5563;
            font-size: 10px;
        }

        .footer p { margin-bottom: 5px; }

        .print-button {
            background: #059669;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
            display: inline-block;
        }

        @media print {
            body { padding: 0; }
            .container { box-shadow: none; padding: 20px; }
            .print-button { display: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        {{-- Letterhead --}}
        <div class="letterhead">
            <div class="company-name">Legal Document Management System</div>
            <div class="company-tagline">Secure. Organized. Compliant.</div>
        </div>

        {{-- Header --}}
        <div class="header">
            <h1>Activity Logs Report</h1>
            <div class="meta-info">
                <div class="meta-item">
                    <span class="meta-label">Generated On</span>
                    <span class="meta-value">{{ $date }} at {{ $time }}</span>
                </div>
                @if(isset($dateRange))
                <div class="meta-item">
                    <span class="meta-label">Date Range</span>
                    <span class="meta-value">{{ $dateRange['start'] }} - {{ $dateRange['end'] }}</span>
                </div>
                @endif
                @if(isset($user))
                <div class="meta-item">
                    <span class="meta-label">User Filter</span>
                    <span class="meta-value">{{ $user->firstname }} {{ $user->lastname }}</span>
                </div>
                @else
                <div class="meta-item">
                    <span class="meta-label">User Filter</span>
                    <span class="meta-value">All Users</span>
                </div>
                @endif
                <div class="meta-item">
                    <span class="meta-label">Total Logs</span>
                    <span class="meta-value">{{ number_format(count($logs)) }}</span>
                </div>
            </div>
        </div>

        {{-- Print Button --}}
        <button class="print-button" onclick="window.print()">Print Report</button>

        {{-- Logs Table --}}
        @if(count($logs) > 0)
            <table>
                <thead>
                    <tr>
                        <th style="width: 20%;">Date & Time</th>
                        <th style="width: 15%;">User</th>
                        <th style="width: 20%;">Action</th>
                        <th style="width: 45%;">Details/Document</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($logs as $log)
                        <tr>
                            <td>{{ \Carbon\Carbon::parse($log->activity_time)->format('M d, Y h:i A') }}</td>
                            <td>
                                @if($log->user)
                                    {{ $log->user->firstname }} {{ $log->user->lastname }}
                                @else
                                    Unknown User
                                @endif
                            </td>
                            <td class="action-type">{{ ucfirst($log->activity_type) }}</td>
                            <td>
                                @if(in_array($log->activity_type, ['login', 'logout']))
                                    User system {{ $log->activity_type }}
                                @else
                                    {{ $log->document ? $log->document->title : 'Unknown Document' }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="no-data">No activity logs found for the selected criteria.</div>
        @endif

        {{-- Footer --}}
        <div class="footer">
            <p><strong>Legal Document Management System</strong> &bull; Official Activity Log Report</p>
            <p>&copy; {{ date('Y') }} All rights reserved. Generated at {{ date('Y-m-d H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
