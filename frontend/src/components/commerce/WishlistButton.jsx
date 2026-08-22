import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { cn } from '@/utils/format.js';

export default function WishlistButton({ serviceId, className, inverse = false }) {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const wishlist = useQuery({
    queryKey: ['wishlist'],
    queryFn: userApi.getWishlist,
    enabled: Boolean(user && serviceId),
    staleTime: 30_000,
  });
  const saved = wishlist.data?.wishlist?.some((service) => service._id === serviceId) || false;

  const toggle = useMutation({
    mutationFn: () => (saved ? userApi.removeFromWishlist(serviceId) : userApi.addToWishlist(serviceId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(saved ? 'Removed from saved services' : 'Saved for later');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      toast('Log in to save services');
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }
    toggle.mutate();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending || wishlist.isLoading}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved services' : 'Save service for later'}
      className={cn(
        'grid h-10 w-10 place-items-center border shadow-sm transition-colors disabled:opacity-50',
        inverse
          ? saved ? 'border-ultra bg-ultra text-ivory' : 'border-ivory/30 bg-ink/70 text-ivory hover:bg-ultra'
          : saved ? 'border-ultra bg-ultra text-ivory' : 'border-hairline bg-ivory text-ink hover:border-ultra hover:text-ultra',
        className
      )}
    >
      <Heart size={16} strokeWidth={1.7} className={saved ? 'fill-current' : undefined} />
    </button>
  );
}
