/**
 * Author Data - Information about blog content authors
 * Improves E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for Google
 */

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  shortBio: string;
  avatar: string;
  expertise: string[];
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  credentials: string[];
}

export const authors: Record<string, Author> = {
  'equipe-moneyquest': {
    slug: 'equipe-moneyquest',
    name: 'Equipe MoneyQuest',
    role: 'Especialistas em Finanças Pessoais',
    bio: `A equipe MoneyQuest é formada por especialistas em finanças pessoais, educação financeira e tecnologia. 
    
Com anos de experiência no mercado financeiro e em desenvolvimento de produtos digitais, nossa missão é democratizar o acesso à educação financeira através da gamificação.

Acreditamos que o controle financeiro não precisa ser tedioso. Por isso, combinamos conhecimento técnico sólido com uma abordagem divertida e envolvente, ajudando milhares de pessoas a transformarem sua relação com o dinheiro.

Nossa equipe inclui:
- Planejadores financeiros certificados
- Especialistas em comportamento do consumidor
- Designers de experiência focados em gamificação
- Desenvolvedores apaixonados por criar soluções que funcionam

Todos os nossos conteúdos são cuidadosamente revisados para garantir precisão, relevância e aplicabilidade prática no dia a dia dos brasileiros.`,
    shortBio: 'Especialistas em finanças pessoais e gamificação, ajudando milhares de pessoas a transformarem sua relação com o dinheiro.',
    avatar: '/logo.png',
    expertise: [
      'Controle Financeiro',
      'Educação Financeira',
      'Gamificação',
      'Hábitos Financeiros',
      'Economia Pessoal'
    ],
    socialLinks: {
      instagram: 'https://instagram.com/moneyquestapp',
      linkedin: 'https://linkedin.com/company/moneyquest',
      twitter: 'https://twitter.com/moneyquestapp'
    },
    credentials: [
      'Certificação em Planejamento Financeiro Pessoal',
      'Especialização em Gamificação e UX',
      '+10.000 usuários ajudados',
      '+500 artigos sobre finanças publicados'
    ]
  }
};

export const defaultAuthor = authors['equipe-moneyquest'];

export const getAuthorBySlug = (slug: string): Author | null => {
  return authors[slug] || null;
};

/**
 * Schema.org Person structured data for author
 */
export const getAuthorSchema = (author: Author, baseUrl: string = 'https://moneyquest.app.br') => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": author.name,
  "url": `${baseUrl}/autor/${author.slug}`,
  "image": `${baseUrl}${author.avatar}`,
  "description": author.shortBio,
  "jobTitle": author.role,
  "sameAs": [
    author.socialLinks.linkedin,
    author.socialLinks.twitter,
    author.socialLinks.instagram
  ].filter(Boolean),
  "knowsAbout": author.expertise
});
