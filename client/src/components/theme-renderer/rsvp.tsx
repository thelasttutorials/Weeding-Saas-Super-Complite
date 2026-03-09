import { type FullInvitation } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

const rsvpSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  whatsapp: z.string().optional(),
  guestCount: z.coerce.number().min(1).max(10),
  status: z.enum(["attending", "not_attending"]),
  message: z.string().optional(),
});

interface RsvpBlockProps {
  content: any;
  style: any;
  invitationData: FullInvitation;
  globalSettings: any;
}

export default function RsvpBlock({ content, style, invitationData, globalSettings }: RsvpBlockProps) {
  const { heading, subHeading, deadline } = content;
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof rsvpSchema>>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      guestCount: 1,
      status: "attending",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof rsvpSchema>) =>
      apiRequest("POST", `/api/public/${invitationData.slug}/rsvp`, data),
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Berhasil!", description: "Konfirmasi kehadiran Anda telah terkirim." });
    },
    onError: (err: any) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div 
      className="py-16 px-4 max-w-lg mx-auto"
      style={{
        backgroundColor: style.backgroundColor || "transparent",
        color: style.textColor || "inherit",
        padding: style.padding || "80px 20px",
      } as React.CSSProperties}
    >
      <div className="text-center mb-8">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: globalSettings.fontHeading }}
        >
          {heading}
        </h2>
        {subHeading && <p className="text-sm opacity-70">{subHeading}</p>}
        {deadline && <p className="text-xs font-bold mt-4 opacity-50 uppercase tracking-widest">Batas Akhir: {deadline}</p>}
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl border border-current/10 bg-current/5 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Terima Kasih!</h3>
          <p className="text-sm opacity-70">Konfirmasi kehadiran Anda telah kami terima.</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-current/10 bg-current/5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4 text-left">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest opacity-70 font-bold">Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-transparent border-current/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-widest opacity-70 font-bold">No. WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-transparent border-current/20" placeholder="08..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs uppercase tracking-widest opacity-70 font-bold">Jumlah Tamu</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-transparent border-current/20" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase tracking-widest opacity-70 font-bold">Konfirmasi</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0 p-3 rounded-lg border border-current/10 bg-current/5">
                          <FormControl>
                            <RadioGroupItem value="attending" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Hadir</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0 p-3 rounded-lg border border-current/10 bg-current/5">
                          <FormControl>
                            <RadioGroupItem value="not_attending" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Tidak Hadir</FormLabel>
                        </FormItem>
                      </RadioGroup>
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
                Kirim Konfirmasi
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
