import { type FullInvitation } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Loader2 } from "lucide-react";

const messageSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  message: z.string().min(5, "Pesan minimal 5 karakter"),
});

interface MessagesBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function MessagesBlock({ content, style, invitationData, globalSettings }: MessagesBlockProps) {
  const { heading, subHeading } = content;
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public", invitationData.slug, "messages"],
  });

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { name: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof messageSchema>) =>
      apiRequest("POST", `/api/public/${invitationData.slug}/messages`, data),
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/public", invitationData.slug, "messages"] });
      toast({ title: "Terkirim!", description: "Ucapan dan doa Anda telah kami terima." });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div 
      className="py-16 px-4 max-w-2xl mx-auto"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        padding: style.padding || "80px 20px",
      } as React.CSSProperties}
    >
      <div className="text-center mb-10">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
        {subHeading && <p className="text-sm opacity-70">{subHeading}</p>}
      </div>

      <div className="space-y-8">
        {/* Form */}
        <div className="p-6 rounded-2xl border border-current/10 bg-current/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 text-left">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest opacity-70 font-bold">Nama</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-transparent border-current/20" placeholder="Nama Anda" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest opacity-70 font-bold">Pesan & Doa</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-transparent border-current/20 resize-none h-24" placeholder="Tulis ucapan di sini..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-current hover:opacity-90 text-white dark:text-black" 
                disabled={mutation.isPending}
                style={{ backgroundColor: globalSettings.primaryColor }}
              >
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kirim Ucapan
              </Button>
            </form>
          </Form>
        </div>

        {/* Messages List */}
        <div className="space-y-4 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-10 opacity-50">Memuat ucapan...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 opacity-40 italic">Belum ada ucapan</div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="p-4 rounded-xl border border-current/5 bg-current/5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-current/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 opacity-50" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{msg.name}</h4>
                  <p className="text-sm opacity-80 mt-1 leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] opacity-40 mt-2">{new Date(msg.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
