import { z } from 'zod';

export const connexionSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ message: 'Adresse e-mail invalide' })),
  motDePasse: z.string().min(1, 'Mot de passe requis').max(200),
  seSouvenir: z.boolean().optional().default(false),
});

export type ConnexionInput = z.infer<typeof connexionSchema>;
