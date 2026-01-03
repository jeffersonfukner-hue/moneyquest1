import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Instagram } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Author } from '@/lib/authorData';

interface AuthorCardProps {
  author: Author;
  compact?: boolean;
}

const AuthorCard = ({ author, compact = false }: AuthorCardProps) => {
  if (compact) {
    return (
      <Link 
        to={`/autor/${author.slug}`}
        className="flex items-center gap-3 group"
      >
        <Avatar className="h-10 w-10 border-2 border-primary/20">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
            {author.name}
          </p>
          <p className="text-sm text-muted-foreground">{author.role}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-muted/30 rounded-xl p-6 border">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Link to={`/autor/${author.slug}`}>
          <Avatar className="h-20 w-20 border-2 border-primary/20 hover:border-primary transition-colors">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="text-2xl">{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <Link to={`/autor/${author.slug}`}>
            <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
              {author.name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mb-2">{author.role}</p>
          <p className="text-sm text-muted-foreground mb-3">{author.shortBio}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {author.expertise.slice(0, 3).map((exp) => (
              <Badge key={exp} variant="secondary" className="text-xs">
                {exp}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-3">
            {author.socialLinks.linkedin && (
              <a 
                href={author.socialLinks.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {author.socialLinks.twitter && (
              <a 
                href={author.socialLinks.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {author.socialLinks.instagram && (
              <a 
                href={author.socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorCard;
