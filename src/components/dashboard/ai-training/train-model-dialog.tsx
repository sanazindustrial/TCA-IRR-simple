
'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Rocket } from 'lucide-react';

export function TrainModelDialog() {
  const { toast } = useToast();

  const handleTrainModel = () => {
    toast({
      title: 'Model Training Started',
      description: 'A new model training job has been queued. You will be notified upon completion.',
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Train New Model</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Rocket />
            Confirm New Model Training
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to start a new model training job? This
            process is resource-intensive and may incur significant costs. It
            will use the latest production data to fine-tune the evaluation
            models.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleTrainModel}>
            Yes, Start Training
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
