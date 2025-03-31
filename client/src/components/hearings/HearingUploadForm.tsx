import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { RefreshCw, Upload } from "lucide-react";

// Schema for the upload form
const uploadFormSchema = z.object({
  comments: z.string().optional(),
  file: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Selecione um arquivo para upload"
  })
});

type HearingUploadFormProps = {
  hearingId: number;
  onSubmitSuccess?: () => void;
};

export default function HearingUploadForm({
  hearingId,
  onSubmitSuccess
}: HearingUploadFormProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  
  // Form definition
  const form = useForm<z.infer<typeof uploadFormSchema>>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      comments: "",
    }
  });
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: z.infer<typeof uploadFormSchema>) => {
      const formData = new FormData();
      formData.append("minutes", data.file[0]);
      
      if (data.comments) {
        formData.append("comments", data.comments);
      }
      
      // Simulated progress updates
      const updateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setUploadProgress(Math.min(progress, 95));
          if (progress >= 95) clearInterval(interval);
        }, 100);
      };
      
      updateProgress();
      
      try {
        const response = await fetch(`/api/hearings/${hearingId}/minutes`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        
        setUploadProgress(100);
        return await response.json();
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Arquivo enviado",
        description: "A ata da audiência foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      onSubmitSuccess?.();
    },
    onError: (error) => {
      setUploadProgress(0);
      toast({
        title: "Erro",
        description: `Falha ao enviar arquivo: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof uploadFormSchema>) => {
    uploadMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="file"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Arquivo da Ata</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => onChange(e.target.files)}
                  {...rest}
                />
              </FormControl>
              <FormDescription>
                Formatos aceitos: PDF, DOC, DOCX, TXT. Tamanho máximo: 10MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações sobre a ata ou a audiência realizada" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-neutral-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Ata
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
