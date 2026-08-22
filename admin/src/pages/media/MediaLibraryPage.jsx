import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Upload, Copy, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import { PageLoader, EmptyState, Badge } from '@/components/ui/index.jsx';
import { Drawer, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Select, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { mediaApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce, useCopy } from '@/hooks/index.js';
import { formatBytes, formatDate } from '@/utils/format.js';

const mediaName = (item) => item?.name || item?.originalName || item?.filename || 'Untitled file';
const MEDIA_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MEDIA_FILES = 10;
const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export default function MediaLibraryPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);
  const [copied, copy] = useCopy();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media', { page, debounced, folder, type }],
    queryFn: () => mediaApi.list({ page, search: debounced, folder, type: type || undefined, limit: 48 }),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['admin', 'media-folders'],
    queryFn: () => mediaApi.listFolders(),
  });

  const upload = useMutation({
    mutationFn: async (files) => {
      const list = Array.isArray(files) ? files : [files];
      const fd = new FormData();
      list.forEach((file) => fd.append('file', file));
      if (folder) fd.append('folder', folder);
      return mediaApi.upload(fd);
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin', 'media'] });
      const count = result?.media?.length || 0;
      toast.success(`${count} image${count === 1 ? '' : 's'} uploaded`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => mediaApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'media'] });
      toast.success('File deleted');
      setDeleteId(null);
      setSelected(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const items = data?.data || [];

  return (
    <>
      <PageHeader
        eyebrow="Operations / Media"
        title={<>Media <span className="text-italic-fraunces text-ultra">library</span></>}
        subtitle="Image assets stored and CDN-served through the backend media library."
        actions={
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = '';
                if (!files.length) return;
                if (files.length > MAX_MEDIA_FILES) {
                  toast.error(`Upload no more than ${MAX_MEDIA_FILES} images at once`);
                  return;
                }
                const unsupported = files.find((file) => !MEDIA_IMAGE_TYPES.includes(file.type));
                if (unsupported) {
                  toast.error(`${unsupported.name} is not a supported JPEG, PNG, WebP, or GIF image`);
                  return;
                }
                const oversized = files.find((file) => file.size > MAX_MEDIA_BYTES);
                if (oversized) {
                  toast.error(`${oversized.name} exceeds the 5 MB upload limit`);
                  return;
                }
                upload.mutate(files);
              }}
            />
            <span className="inline-flex items-center gap-2 bg-ink text-ivory px-5 py-2.5 text-mono text-xs uppercase tracking-widest hover:bg-graphite transition-colors">
              <Upload size={14} strokeWidth={1.5} />
              {upload.isPending ? 'Uploading…' : 'Upload images'}
            </span>
          </label>
        }
      />

      <FilterBar>
        <SearchInput
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search files…"
          className="w-64"
        />
        <Select
          className="w-48"
          options={[
            { value: '', label: 'All folders' },
            ...folders.map((f) => ({ value: f.name || f, label: f.name || f })),
          ]}
          value={folder}
          onChange={(e) => { setFolder(e.target.value); setPage(1); }}
        />
        <Select
          className="w-36"
          options={[
            { value: '', label: 'All types' },
            { value: 'image', label: 'Images' },
            { value: 'video', label: 'Video' },
            { value: 'audio', label: 'Audio' },
            { value: 'document', label: 'Documents' },
            { value: 'other', label: 'Other' },
          ]}
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
        />
      </FilterBar>

      {isLoading ? (
        <PageLoader label="Loading media" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No files yet"
          subtitle="Upload your first image to build the library."
        />
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <button
              type="button"
              key={item._id}
              onClick={() => setSelected(item)}
              className="group aspect-square bg-ivory-soft border border-hairline hover:border-ink transition-colors relative overflow-hidden"
            >
              {item.type?.startsWith('image') || item.url?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                <img src={item.url} alt={item.altText || mediaName(item)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center">
                  <div className="text-center px-3">
                    <div className="text-mono text-2xl text-slate">
                      {(mediaName(item) || '').split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                    <div className="text-mono text-[0.6rem] text-slate uppercase tracking-widest mt-2 truncate">
                      {mediaName(item)}
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-ink/80 text-ivory p-2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                <div className="text-mono text-[0.65rem] truncate">{mediaName(item)}</div>
                <div className="text-mono text-[0.6rem] text-ivory/60">{formatBytes(item.size)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {data?.meta && (data.meta.totalPages ?? data.meta.pages ?? 1) > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-mono text-xs text-slate px-4">
            Page {data.meta.page} of {data.meta.totalPages ?? data.meta.pages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= (data.meta.totalPages ?? data.meta.pages)} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="File details"
        description={mediaName(selected)}
      >
        {selected && (
          <div className="space-y-6">
            <div className="border border-hairline p-4 bg-ivory-soft">
              {selected.type?.startsWith('image') || selected.url?.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                <img src={selected.url} alt="" className="w-full max-h-96 object-contain mx-auto" />
              ) : (
                <div className="py-16 text-center">
                  <div className="text-display-md text-slate">
                    {(mediaName(selected) || '').split('.').pop()?.toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="text-eyebrow mb-2">Public URL</div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={selected.url}
                  aria-label="Public media URL"
                  className="flex-1 px-3 py-2 text-mono text-xs bg-ivory-soft border border-hairline"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={copied ? Check : Copy}
                  onClick={() => copy(selected.url)}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Filename</div><div className="mt-1 truncate">{mediaName(selected)}</div></div>
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Size</div><div className="mt-1 text-mono">{formatBytes(selected.size)}</div></div>
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Type</div><div className="mt-1 text-mono">{selected.type || '—'}</div></div>
              {selected.folder && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Folder</div><div className="mt-1"><Badge tone="outline">{selected.folder}</Badge></div></div>}
              {(selected.width && selected.height) && <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Dimensions</div><div className="mt-1 text-mono">{selected.width} × {selected.height}</div></div>}
              <div><div className="text-mono text-xs text-slate uppercase tracking-widest">Uploaded</div><div className="mt-1">{formatDate(selected.createdAt, 'medium')}</div></div>
            </div>

            <div className="pt-4 border-t border-hairline">
              <Button variant="danger_ghost" icon={Trash2} onClick={() => setDeleteId(selected._id)}>
                Delete file
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => remove.mutate(deleteId)}
        loading={remove.isPending}
        title="Delete this file?"
        description="It will be permanently removed from storage and any references will break."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
