import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch, Ellipse
import numpy as np

# ── Canvas ──────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(36, 52))
ax.set_xlim(0, 36)
ax.set_ylim(0, 52)
ax.axis('off')
fig.patch.set_facecolor('#FFFFFF')

# ── Helpers ─────────────────────────────────────────────────
def draw_actor(ax, x, y, label, color='#1e293b'):
    # Head
    ax.add_patch(plt.Circle((x, y + 1.1), 0.38, color=color, zorder=5))
    # Body
    ax.plot([x, x], [y + 0.72, y - 0.2], color=color, lw=2.2, zorder=5)
    # Arms
    ax.plot([x - 0.55, x + 0.55], [y + 0.3, y + 0.3], color=color, lw=2.2, zorder=5)
    # Legs
    ax.plot([x, x - 0.45], [y - 0.2, y - 0.9], color=color, lw=2.2, zorder=5)
    ax.plot([x, x + 0.45], [y - 0.2, y - 0.9], color=color, lw=2.2, zorder=5)
    # Label
    ax.text(x, y - 1.15, label, ha='center', va='top', fontsize=8.5,
            fontweight='bold', color=color, zorder=5,
            multialignment='center')

def draw_usecase(ax, x, y, label, w=3.6, h=0.62, fc='#f8fafc', ec='#64748b'):
    ellipse = Ellipse((x, y), width=w, height=h, facecolor=fc,
                      edgecolor=ec, linewidth=1.3, zorder=4)
    ax.add_patch(ellipse)
    # wrap long text
    words = label.split()
    lines, line = [], []
    for w_ in words:
        line.append(w_)
        if len(' '.join(line)) > 22:
            lines.append(' '.join(line[:-1]))
            line = [w_]
    lines.append(' '.join(line))
    text = '\n'.join(lines)
    fontsize = 7.5 if len(lines) == 1 else 7.0
    ax.text(x, y, text, ha='center', va='center', fontsize=fontsize,
            color='#1e293b', zorder=5, multialignment='center',
            linespacing=1.3)

def draw_package(ax, x, y, w, h, label, fc='#f1f5f9', ec='#94a3b8'):
    rect = mpatches.FancyBboxPatch((x, y), w, h,
        boxstyle="round,pad=0.1", facecolor=fc, edgecolor=ec,
        linewidth=1.5, zorder=2)
    ax.add_patch(rect)
    # tab
    tab = mpatches.FancyBboxPatch((x, y + h), len(label)*0.13 + 0.4, 0.38,
        boxstyle="round,pad=0.05", facecolor=ec, edgecolor=ec,
        linewidth=1, zorder=3)
    ax.add_patch(tab)
    ax.text(x + 0.2, y + h + 0.19, label, fontsize=8, fontweight='bold',
            color='#1e293b', va='center', zorder=4)

def arrow(ax, x1, y1, x2, y2, style='->', color='#475569', lw=1.2, label=''):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color,
                                lw=lw, connectionstyle='arc3,rad=0.0'),
                zorder=6)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my + 0.13, label, fontsize=6.5, color='#64748b',
                ha='center', style='italic', zorder=7)

def dashed_arrow(ax, x1, y1, x2, y2, label=''):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color='#94a3b8', lw=1.1,
                                linestyle='dashed',
                                connectionstyle='arc3,rad=0.0'),
                zorder=6)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx, my + 0.13, label, fontsize=6.2, color='#94a3b8',
                ha='center', style='italic', zorder=7)

# ════════════════════════════════════════════════════════════
# SYSTEM BOUNDARY
# ════════════════════════════════════════════════════════════
system_rect = mpatches.FancyBboxPatch((4.2, 0.4), 27.4, 51.0,
    boxstyle="round,pad=0.15", facecolor='#ffffff', edgecolor='#334155',
    linewidth=2.5, zorder=1)
ax.add_patch(system_rect)
ax.text(17.9, 51.15, 'SGRH — Faculté Polydisciplinaire de Taroudant',
        ha='center', va='bottom', fontsize=13, fontweight='bold',
        color='#0f172a', zorder=5)

# ════════════════════════════════════════════════════════════
# PACKAGES  (x, y, w, h, label)
# ════════════════════════════════════════════════════════════
pkgs = [
    (4.5,  48.4, 7.0, 2.2,  'Authentification'),
    (13.0, 48.4, 6.5, 2.2,  'Profil'),
    (21.0, 48.4, 10.2,2.2,  'Tableau de bord'),
    (4.5,  43.2, 26.7,4.8,  'Gestion des Demandes'),
    (4.5,  37.5, 26.7,5.3,  'Attestations & Documents'),
    (4.5,  32.5, 12.8,4.6,  'Modèles de Documents'),
    (18.5, 32.5, 12.7,4.6,  'Congés'),
    (4.5,  27.4, 12.8,4.7,  'Missions'),
    (18.5, 27.4, 12.7,4.7,  'Présences & Absences'),
    (4.5,  22.3, 26.7,4.7,  'Gestion des Employés & Salaires'),
    (4.5,  17.2, 26.7,4.7,  'Évaluations & Promotions'),
    (4.5,  12.1, 12.8,4.7,  'Messagerie'),
    (18.5, 12.1, 12.7,4.7,  'Notifications'),
    (4.5,   7.0, 12.8,4.7,  'IA & Analyses'),
    (18.5,  7.0, 12.7,4.7,  'Rapports & Audit'),
    (4.5,   0.8, 26.7,5.8,  'Administration Système (Super Admin)'),
]
for px, py, pw, ph, pl in pkgs:
    draw_package(ax, px, py, pw, ph, pl)

# ════════════════════════════════════════════════════════════
# USE CASES  (cx, cy, label)
# ════════════════════════════════════════════════════════════
uc = {}

# Authentification
uc['login']       = (8.0,  49.55, 'Se connecter')
uc['pwd']         = (8.0,  48.95, 'Réinitialiser mot de passe')  # repositioned below

# Profil
uc['profile']     = (15.2, 49.55, 'Consulter son profil')
uc['edit_profile']= (15.2, 48.95, 'Modifier son profil')

# Tableau de bord
uc['dash']        = (24.0, 49.55, 'Tableau de bord personnel')
uc['sadash']      = (28.5, 49.55, 'Tableau de bord Super Admin')

# Gestion des demandes — row 1
uc['cert']        = (6.5,  47.2, 'Soumettre une attestation')
uc['free']        = (11.5, 47.2, 'Soumettre une demande libre')
uc['leave_req']   = (17.0, 47.2, 'Soumettre une demande de congé')
uc['miss_req']    = (22.5, 47.2, 'Soumettre une mission')
# row 2
uc['my_req']      = (7.5,  44.6, 'Consulter mes demandes')
uc['all_req']     = (13.5, 44.6, 'Toutes les demandes (HR)')
uc['approve']     = (19.5, 44.6, 'Approuver une demande')
uc['reject']      = (25.5, 44.6, 'Rejeter une demande')

# Attestations & Documents — row 1
uc['my_docs']     = (6.5,  42.0, 'Consulter mes documents')
uc['preview']     = (11.2, 42.0, 'Prévisualiser un document')
uc['gen_pdf']     = (16.0, 42.0, 'Générer un PDF')
uc['dl_pdf']      = (21.0, 42.0, 'Télécharger un PDF')
# row 2
uc['sign']        = (8.5,  38.9, 'Signer un document')
uc['dl_att']      = (14.5, 38.9, 'Télécharger pièce jointe')
uc['manage_docs'] = (21.5, 38.9, 'Gérer les demandes (HR)')

# Modèles
uc['tpl_list']    = (6.2,  36.3, 'Consulter les modèles')
uc['tpl_create']  = (6.2,  35.5, 'Créer un modèle')
uc['tpl_edit']    = (11.5, 36.3, 'Modifier un modèle')
uc['tpl_del']     = (11.5, 35.5, 'Supprimer un modèle')
uc['tpl_prev']    = (9.0,  33.0, 'Prévisualiser un modèle')

# Congés
uc['my_leaves']   = (20.5, 36.3, 'Consulter mes congés')
uc['leave_dept']  = (25.5, 36.3, 'Approuver congé (Chef Dept)')
uc['leave_hr']    = (20.5, 35.5, 'Approuver congé (RH)')
uc['leave_bal']   = (25.5, 35.5, 'Suivre les soldes de congés')

# Missions
uc['miss_list']   = (6.5,  31.2, 'Consulter les missions')
uc['miss_appr']   = (11.5, 31.2, 'Approuver une mission')
uc['miss_pdf']    = (9.0,  28.8, 'Générer ordre de mission')

# Présences
uc['att_rec']     = (21.0, 31.2, 'Enregistrer présence')
uc['att_view']    = (26.5, 31.2, 'Consulter présences')

# Employés & Salaires
uc['emp_list']    = (7.5,  26.1, 'Consulter les enseignants')
uc['staff_list']  = (13.5, 26.1, 'Consulter le personnel admin.')
uc['dept']        = (19.5, 26.1, 'Gérer les départements')
uc['sal']         = (7.5,  23.6, 'Consulter les salaires')
uc['payslip']     = (13.5, 23.6, 'Consulter les fiches de paie')

# Évaluations & Promotions
uc['eval_view']   = (7.5,  21.0, 'Consulter les évaluations')
uc['eval_create'] = (13.5, 21.0, 'Créer une évaluation')
uc['eval_edit']   = (19.5, 21.0, 'Modifier une évaluation')
uc['promo']       = (7.5,  18.5, 'Générer tableaux d\'avancement')
uc['promo_exp']   = (13.5, 18.5, 'Exporter tableaux PDF')

# Messagerie
uc['msg_send']    = (6.5,  15.9, 'Envoyer un message')
uc['msg_view']    = (11.5, 15.9, 'Consulter les messages')
uc['msg_att']     = (9.0,  13.5, 'Joindre un fichier')

# Notifications
uc['notif']       = (21.0, 15.9, 'Consulter les notifications')
uc['notif_read']  = (26.5, 15.9, 'Marquer comme lu')
uc['broadcast']   = (23.5, 13.5, 'Diffusion groupée (broadcast)')

# IA
uc['ai']          = (6.5,  10.8, 'Consulter les insights IA')
uc['ai_leave']    = (11.5, 10.8, 'Détecter tendances congés')
uc['ai_late']     = (6.5,   8.3, 'Détecter retards récurrents')
uc['ai_rec']      = (11.5,  8.3, 'Recommandations automatiques')

# Rapports & Audit
uc['reports']     = (21.0, 10.8, 'Générer rapports RH')
uc['export']      = (26.5, 10.8, 'Exporter données')
uc['audit']       = (23.5,  8.3, 'Journal d\'audit')

# Admin système
uc['users']       = (7.5,   5.7, 'Gérer les utilisateurs')
uc['toggle']      = (13.5,  5.7, 'Activer / Désactiver compte')
uc['reset_pwd']   = (19.5,  5.7, 'Réinitialiser mot de passe')
uc['sys_dash']    = (25.5,  5.7, 'Tableau de bord système')
uc['perf_eval']   = (10.5,  2.5, 'Évaluer performances système')
uc['config']      = (21.5,  2.5, 'Configuration système')

# Draw all use cases
for key, (cx, cy, label) in uc.items():
    draw_usecase(ax, cx, cy, label)

# ════════════════════════════════════════════════════════════
# ACTORS  — positioned outside system boundary
# ════════════════════════════════════════════════════════════
actors = {
    'SA':  (1.5,  3.5,  'Super\nAdmin',        '#0f172a'),
    'HR':  (1.5,  13.0, 'Admin\nRH',           '#1e3a5f'),
    'CD':  (1.5,  24.0, 'Chef de\nDépartement','#14532d'),
    'PR':  (33.5, 33.0, 'Professeur',          '#581c87'),
    'ST':  (33.5, 24.0, 'Personnel\nAdmin.',   '#7c2d12'),
    'ETU': (33.5, 48.0, 'Étudiant',            '#1e3a5f'),
}
for key, (ax_, ay, label, color) in actors.items():
    draw_actor(ax, ax_, ay, label, color)

# ════════════════════════════════════════════════════════════
# ACTOR → USE CASE ARROWS
# ════════════════════════════════════════════════════════════
def a(actor_key, uc_key, c='#64748b'):
    ax_, ay, _, _ = actors[actor_key]
    cx, cy, _ = uc[uc_key]
    arrow(ax, ax_, ay, cx - 1.8, cy, color=c, lw=1.0)

def ar(actor_key, uc_key, c='#64748b'):
    """Arrow from right side actor"""
    ax_, ay, _, _ = actors[actor_key]
    cx, cy, _ = uc[uc_key]
    arrow(ax, ax_, ay, cx + 1.8, cy, color=c, lw=1.0)

# ── SUPER ADMIN ──
SA_COLOR = '#0f172a'
for k in ['login','sadash','users','toggle','reset_pwd','sys_dash',
          'perf_eval','config','broadcast','audit','all_req','approve',
          'reject','manage_docs','tpl_list','tpl_create','tpl_edit',
          'tpl_del','reports','ai','msg_send','notif','profile']:
    a('SA', k, SA_COLOR)

# ── ADMIN RH ──
HR_COLOR = '#1e40af'
for k in ['login','dash','profile','all_req','approve','reject',
          'manage_docs','preview','gen_pdf','dl_pdf','dl_att',
          'tpl_list','tpl_create','tpl_edit','tpl_del','tpl_prev',
          'leave_hr','leave_bal','miss_appr','miss_pdf','miss_list',
          'emp_list','staff_list','dept','sal','payslip',
          'att_rec','att_view','eval_view','eval_create','eval_edit',
          'promo','promo_exp','ai','ai_leave','ai_late','ai_rec',
          'reports','export','audit','msg_send','msg_view',
          'notif','notif_read','broadcast']:
    a('HR', k, HR_COLOR)

# ── CHEF DE DÉPARTEMENT ──
CD_COLOR = '#15803d'
for k in ['login','dash','profile','cert','free','leave_req','miss_req',
          'my_req','my_leaves','leave_dept','miss_list','my_docs',
          'dl_pdf','sign','eval_view','eval_create','att_view',
          'msg_send','msg_view','notif','notif_read']:
    a('CD', k, CD_COLOR)

# ── PROFESSEUR (right side) ──
PR_COLOR = '#7e22ce'
for k in ['login','dash','profile','cert','free','leave_req','miss_req',
          'my_req','my_leaves','leave_bal','miss_list','my_docs',
          'dl_pdf','sign','att_view','msg_send','msg_view',
          'notif','notif_read']:
    ar('PR', k, PR_COLOR)

# ── PERSONNEL ADMIN (right side) ──
ST_COLOR = '#c2410c'
for k in ['login','dash','profile','cert','free','leave_req','miss_req',
          'my_req','my_leaves','leave_bal','miss_list','my_docs',
          'dl_pdf','att_view','msg_send','msg_view','notif','notif_read']:
    ar('ST', k, ST_COLOR)

# ── ÉTUDIANT (right side) ──
ETU_COLOR = '#0369a1'
for k in ['login','pwd','dash','profile','cert','free',
          'my_req','my_docs','dl_pdf','notif','notif_read']:
    ar('ETU', k, ETU_COLOR)

# ════════════════════════════════════════════════════════════
# INCLUDE / EXTEND (dashed)
# ════════════════════════════════════════════════════════════
deps = [
    ('approve',   'notif',      '«include»'),
    ('reject',    'notif',      '«include»'),
    ('gen_pdf',   'dl_pdf',     '«extend»'),
    ('sign',      'dl_pdf',     '«include»'),
    ('miss_appr', 'miss_pdf',   '«include»'),
    ('free',      'dl_att',     '«extend»'),
    ('msg_send',  'msg_att',    '«extend»'),
    ('ai',        'ai_leave',   '«include»'),
    ('ai',        'ai_late',    '«include»'),
    ('ai',        'ai_rec',     '«include»'),
    ('promo',     'promo_exp',  '«extend»'),
    ('leave_req', 'leave_dept', '«include»'),
    ('leave_dept','leave_hr',   '«include»'),
]
for src_k, dst_k, lbl in deps:
    sx, sy, _ = uc[src_k]
    dx, dy, _ = uc[dst_k]
    dashed_arrow(ax, sx, sy, dx, dy, label=lbl)

# ════════════════════════════════════════════════════════════
# LEGEND
# ════════════════════════════════════════════════════════════
legend_x, legend_y = 4.7, 0.05
ax.text(legend_x, legend_y + 0.55, 'Légende :', fontsize=8,
        fontweight='bold', color='#1e293b')
# solid arrow
ax.annotate('', xy=(legend_x + 1.4, legend_y + 0.25),
            xytext=(legend_x + 0.5, legend_y + 0.25),
            arrowprops=dict(arrowstyle='->', color='#475569', lw=1.5))
ax.text(legend_x + 1.55, legend_y + 0.25, 'Association acteur → cas',
        fontsize=7.5, va='center', color='#475569')
# dashed arrow
ax.annotate('', xy=(legend_x + 7.2, legend_y + 0.25),
            xytext=(legend_x + 6.3, legend_y + 0.25),
            arrowprops=dict(arrowstyle='->', color='#94a3b8', lw=1.2,
                            linestyle='dashed'))
ax.text(legend_x + 7.35, legend_y + 0.25, '«include» / «extend»',
        fontsize=7.5, va='center', color='#94a3b8')

# ════════════════════════════════════════════════════════════
# ACTOR LEGEND (color key)
# ════════════════════════════════════════════════════════════
actor_legend = [
    ('#0f172a', 'Super Admin'),
    ('#1e40af', 'Administrateur RH'),
    ('#15803d', 'Chef de Département'),
    ('#7e22ce', 'Professeur'),
    ('#c2410c', 'Personnel Administratif'),
    ('#0369a1', 'Étudiant'),
]
lx = 16.0
for i, (color, label) in enumerate(actor_legend):
    ax.add_patch(plt.Circle((lx + i * 3.2, legend_y + 0.28), 0.18,
                             color=color, zorder=5))
    ax.text(lx + i * 3.2 + 0.28, legend_y + 0.28, label,
            fontsize=7.5, va='center', color=color)

# ════════════════════════════════════════════════════════════
# TITLE
# ════════════════════════════════════════════════════════════
ax.text(18, 51.65,
        "Diagramme de Cas d'Utilisation — Système de Gestion des Ressources Humaines",
        ha='center', va='center', fontsize=14, fontweight='bold',
        color='#0f172a')
ax.text(18, 51.3,
        'Faculté Polydisciplinaire de Taroudant',
        ha='center', va='center', fontsize=10, color='#475569')

plt.tight_layout(pad=0.3)
plt.savefig('use_case_diagram.png', dpi=180, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print('Done — use_case_diagram.png saved.')
