
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const matrixData = [
    [120, 5, 2],
    [8, 110, 7],
    [1, 3, 95]
];

const labels = ['Recommend', 'Hold', 'Reject'];

export function ConfusionMatrix() {
  return (
    <div className="w-full">
        <div className="flex items-center">
            <div className="w-24 text-sm text-muted-foreground text-center -rotate-90">Actual</div>
            <div className="flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]"></TableHead>
                            {labels.map(label => <TableHead key={label} className="text-center">{label}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {matrixData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                <TableCell className="font-semibold text-center">{labels[rowIndex]}</TableCell>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex} className={`text-center font-bold text-lg ${rowIndex === cellIndex ? 'bg-primary/20 text-primary-foreground' : 'bg-muted/30'}`}>
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
        <p className="text-center mt-2 text-sm text-muted-foreground">Predicted</p>
    </div>
  );
}
