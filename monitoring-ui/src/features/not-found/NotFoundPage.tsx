import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The address you opened does not exist in this interface.
      </p>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Back to overview
      </Link>
    </div>
  );
}