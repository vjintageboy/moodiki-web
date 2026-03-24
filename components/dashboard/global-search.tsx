import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, UserSquare2, Loader2, Link as LinkIcon, Calendar, Bell } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/use-global-search';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data: results, isLoading } = useGlobalSearch(debouncedQuery);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (urlPath: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(urlPath);
  };

  const hasResults = results && results.length > 0;
  const showDropdown = isOpen && (query.length >= 2);

  return (
    <div className="relative w-full z-50" ref={containerRef}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search users, experts..."
        className="w-full bg-accent/50 border-none focus-visible:ring-1 pl-9"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full min-w-[300px] bg-popover text-popover-foreground rounded-md shadow-md border overflow-hidden max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="p-4 flex justify-center items-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </div>
          )}

          {!isLoading && !hasResults && debouncedQuery.length >= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {!isLoading && hasResults && (
            <div className="py-2">
              <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Results
              </div>
              <ul className="flex flex-col">
                {results.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      onClick={() => handleSelect(item.url_path)}
                      className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-start flex-col gap-1 transition-colors focus:bg-accent focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        {item.type === 'user' ? (
                          <UserSquare2 className="w-4 h-4 text-blue-500" />
                        ) : item.type === 'expert' ? (
                          <MapPin className="w-4 h-4 text-green-500" />
                        ) : item.type === 'appointment' ? (
                          <Calendar className="w-4 h-4 text-purple-500" />
                        ) : item.type === 'notification' ? (
                          <Bell className="w-4 h-4 text-amber-500" />
                        ) : (
                          <LinkIcon className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium text-sm line-clamp-1">{item.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground pl-6 line-clamp-1">
                        {item.subtitle}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
