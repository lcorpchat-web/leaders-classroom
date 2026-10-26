import { useState } from 'react'
import { Link } from 'react-router'
import { ChartColumn, CircleCheck, Mail, MapPin, Pencil, Phone, UserRound, UsersRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { ClasseVignette } from '@/components/ui/ClasseVignette'
import { Chargement } from '@/components/ui/Feedback'
import { routes } from '@/config/routes'
import { libellesRole } from '@/features/auth'
import { useClasses } from '@/features/classes'
import { useProfil } from '@/features/profil/profil'
import { useTableauDeBord, type Periode } from '@/features/tableau-de-bord/tableauDeBord'
import { messageErreur } from '@/lib/api/client'
import { formaterJour } from '@/lib/format'
import { PhotoProfil } from './components/PhotoProfil'
import styles from './MonCompte.module.css'

/** « Mon profil » (maquette 06, colonne de gauche) : identité, informations et statistiques d'enseignement. */
export function ProfilPage() {
  const { data: profil, isLoading, isError, error } = useProfil()
  const [periode, setPeriode] = useState<Periode>('mois')
  const { data: tdb } = useTableauDeBord(periode)
  const { data: classes } = useClasses({ active: true, parPage: 100 })

  if (isLoading) return <Chargement />
  if (isError || !profil) return <Alert variante="erreur">{messageErreur(error)}</Alert>

  const enseignant = profil.role === 'ENSEIGNANT'
  const niveaux = [...new Set((classes?.donnees ?? []).map((c) => c.niveau).filter(Boolean))].join(', ')

  return (
    <div className={styles.profilGrille}>
      <section className={styles.carte}>
        <header className={styles.carteEntete}>
          <span className={styles.carteIcone} aria-hidden>
            <UserRound size={22} />
          </span>
          <div className={styles.carteTitres}>
            <h1>Mon profil</h1>
            <p>Gérez vos informations personnelles et professionnelles.</p>
          </div>
          <ButtonLink to={routes.parametres} size="sm">
            <Pencil size={16} aria-hidden />
            Modifier le profil
          </ButtonLink>
        </header>

        <div className={styles.identite}>
          <PhotoProfil profil={profil} />
          <div>
            <p className={styles.identiteNom}>
              {enseignant ? 'M. ' : ''}
              {profil.prenom} {profil.nom}
            </p>
            <p className={styles.identiteRole}>{libellesRole[profil.role]}</p>
            <Badge ton="succes">
              <CircleCheck size={14} aria-hidden />
              Compte vérifié
            </Badge>
            <ul role="list" className={styles.coordonnees}>
              <li>
                <Mail size={18} aria-hidden />
                {profil.email}
              </li>
              {profil.telephone && (
                <li>
                  <Phone size={18} aria-hidden />
                  {profil.telephone}
                </li>
              )}
              {profil.ville && (
                <li>
                  <MapPin size={18} aria-hidden />
                  {profil.ville}
                </li>
              )}
            </ul>
          </div>
        </div>

        <dl className={styles.details}>
          {enseignant && (
            <>
              <dt>Spécialité</dt>
              <dd>{profil.specialite ?? '—'}</dd>
              <dt>Niveaux enseignés</dt>
              <dd>{niveaux || '—'}</dd>
            </>
          )}
          {profil.matricule && (
            <>
              <dt>Matricule</dt>
              <dd>{profil.matricule}</dd>
            </>
          )}
          <dt>Membre depuis</dt>
          <dd>{formaterJour(profil.creeLe)}</dd>
          <dt>Biographie</dt>
          <dd className={styles.biographie}>{profil.biographie ?? 'Ajoutez une courte présentation depuis « Modifier le profil ».'}</dd>
        </dl>
      </section>

      {tdb && tdb.role !== 'APPRENANT' && (
        <div className={styles.colonne}>
          <section className={styles.carte}>
            <header className={styles.carteEntete}>
              <span className={styles.carteIcone} aria-hidden>
                <ChartColumn size={22} />
              </span>
              <h2 className={styles.titreCarte}>{enseignant ? 'Mes statistiques d’enseignement' : 'Statistiques'}</h2>
              <select className={styles.selectPeriode} aria-label="Période" value={periode} onChange={(e) => setPeriode(e.target.value as Periode)}>
                <option value="semaine">Cette semaine</option>
                <option value="mois">Ce mois-ci</option>
                <option value="semestre">Ce semestre</option>
              </select>
            </header>
            <ul role="list" className={styles.tuiles}>
              <li className={styles.tuileOrange}>
                <strong>{tdb.statistiques.apprenants.valeur ?? 0}</strong>
                Étudiants actifs
              </li>
              <li className={styles.tuileVerte}>
                <strong>{tdb.indicateurs.classes}</strong>
                Classes actives
              </li>
              <li className={styles.tuileViolette}>
                <strong>{tdb.statistiques.seancesRealisees.valeur ?? 0}</strong>
                Séances réalisées
              </li>
              <li className={styles.tuileBleue}>
                <strong>{tdb.statistiques.tauxPresence.valeur === null ? '—' : `${tdb.statistiques.tauxPresence.valeur}%`}</strong>
                Taux de présence
              </li>
            </ul>
          </section>

          <section className={styles.carte}>
            <header className={styles.carteEntete}>
              <span className={styles.carteIcone} aria-hidden>
                <UsersRound size={22} />
              </span>
              <h2 className={styles.titreCarte}>Mes classes</h2>
              <Link to={routes.classes} className={styles.voirTout}>
                Voir toutes
              </Link>
            </header>
            <ul role="list" className={styles.classes}>
              {tdb.classes.map((c) => (
                <li key={c.id}>
                  <Link to={routes.classe(c.id)} className={styles.classe}>
                    <ClasseVignette classe={c} className={styles.classeVignette} />
                    <span className={styles.classeTexte}>
                      <strong>{c.nom}</strong>
                      <span>
                        {c.nbApprenants} étudiant{c.nbApprenants > 1 ? 's' : ''}
                      </span>
                    </span>
                    <Badge ton="succes">En cours</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
