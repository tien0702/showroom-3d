import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const STATUS: Record<string, string> = { M: 'sửa', A: 'thêm', D: 'xoá', '??': 'mới', R: 'đổi tên' };

/** Shows unpublished changes and commits + pushes them to GitHub (Pages redeploys itself). */
export function PublishBar({ tick }: { tick: number }) {
  const [git, setGit] = useState<Awaited<ReturnType<typeof api.git>> | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ text: string; ok: boolean } | null>(null);

  const refresh = useCallback(() => api.git().then(setGit, () => setGit(null)), []);
  useEffect(() => {
    refresh();
  }, [tick, refresh]);

  const publish = async () => {
    setBusy(true);
    setLog(null);
    try {
      const r = await api.publish(message.trim());
      setLog({ text: r.log, ok: true });
      setMessage('');
    } catch (e) {
      setLog({ text: (e as { log?: string }).log || (e as Error).message, ok: false });
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const n = git?.changes.length ?? 0;
  const repo = git?.remote.match(/github\.com[/:]([^/]+)\/(.+?)(\.git)?$/);
  const site = repo ? `https://${repo[1]}.github.io/${repo[2]}/` : null;
  const actions = repo ? `https://github.com/${repo[1]}/${repo[2]}/actions` : null;

  return (
    <section className={`ad-publish ${n ? 'dirty' : ''}`}>
      <div className="ad-publishRow">
        <span className="ad-dot" />
        <span>
          {n ? (
            <>
              <strong>{n} thay đổi</strong> chưa đăng lên web
            </>
          ) : (
            'Web đã khớp với dữ liệu trên máy'
          )}
          {git && <span className="ad-muted"> · nhánh {git.branch}</span>}
        </span>
        {n > 0 && (
          <button className="ad-btn ghost sm" onClick={() => setOpen((o) => !o)}>
            {open ? 'Ẩn' : 'Xem'} danh sách
          </button>
        )}
        <div className="ad-grow" />
        <input className="ad-input" placeholder="Ghi chú lần đăng (không bắt buộc)" value={message} onChange={(e) => setMessage(e.target.value)} disabled={busy} />
        <button className="ad-btn primary" onClick={publish} disabled={busy || !n}>
          {busy ? 'Đang đăng…' : 'Đăng lên web'}
        </button>
      </div>
      {!!git?.otherChanges.length && (
        <p className="ad-warn">
          ⚠ Còn {git.otherChanges.length} file code chưa commit. Nút “Đăng lên web” chỉ đăng dữ liệu (sản phẩm, ảnh, phòng), nên hãy commit code trước.
        </p>
      )}
      {open && n > 0 && (
        <ul className="ad-changes">
          {git!.changes.map((c) => (
            <li key={c}>
              <em>{STATUS[c.slice(0, 2).trim()] ?? c.slice(0, 2)}</em> {c.slice(3)}
            </li>
          ))}
        </ul>
      )}
      {log && (
        <div className={`ad-log ${log.ok ? 'ok' : 'err'}`}>
          {log.ok ? (
            <p>
              ✓ Đã đẩy lên GitHub. Web tự cập nhật sau khoảng 1–2 phút
              {actions && (
                <>
                  {' '}(<a href={actions} target="_blank" rel="noreferrer">xem tiến trình</a>)
                </>
              )}
              {site && (
                <>
                  {' '}· <a href={site} target="_blank" rel="noreferrer">mở web</a>
                </>
              )}
            </p>
          ) : (
            <p>✗ Không đăng được. Chi tiết:</p>
          )}
          <pre>{log.text}</pre>
          <button className="ad-btn ghost sm" onClick={() => setLog(null)}>
            Đóng
          </button>
        </div>
      )}
    </section>
  );
}
