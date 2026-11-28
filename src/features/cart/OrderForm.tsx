import { useState, type FormEvent } from 'react';
import { brand } from '@/app/config';
import { catalog, priceOf, variantOf } from '@/features/catalog/api';
import { formatPrice } from '@/shared/lib/format';
import { Button, Icons } from '@/shared/ui';
import { cartTotal, type CartLine } from './store';
import s from './cart.module.css';

/** Vietnamese mobile/landline: 10–11 digits starting with 0, or +84. */
const PHONE_RE = /^(?:\+?84|0)\d{9,10}$/;

function orderText(lines: CartLine[]) {
  const rows = lines.map((l, i) => {
    const p = catalog.bySku(l.sku);
    if (!p) return '';
    return `${i + 1}. ${p.name} (${variantOf(p, l.variant).label}) × ${l.qty} = ${formatPrice(priceOf(p, l.variant) * l.qty)}`;
  });
  return `${rows.filter(Boolean).join('\n')}\n\nTạm tính: ${formatPrice(cartTotal(lines))}`;
}

interface Props {
  lines: CartLine[];
  onSent: () => void;
  onCancel: () => void;
}

/** Collects the customer's phone and sends the cart to the shop's email. */
export function OrderForm({ lines, onSent, onCancel }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const tel = phone.replace(/[\s.-]/g, '');
    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    if (!PHONE_RE.test(tel)) {
      setError('Số điện thoại chưa đúng (VD: 0912 345 678)');
      return;
    }
    setError(null);
    setSending(true);
    const order = orderText(lines);
    const payload = {
      _subject: `Đơn hàng mới – ${name.trim()} – ${tel}`,
      _template: 'box',
      _captcha: 'false',
      'Khách hàng': name.trim(),
      'Số điện thoại': tel,
      'Sản phẩm': order,
      'Gửi lúc': new Date().toLocaleString('vi-VN'),
    };
    try {
      const res = await fetch(brand.orderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: string | boolean };
      if (!res.ok || String(json.success) === 'false') throw new Error('send failed');
      onSent();
    } catch {
      // Fall back to the visitor's own mail app so the order is never lost.
      const body = `Khách hàng: ${payload['Khách hàng']}\nSĐT: ${tel}\n\n${order}`;
      window.location.href = `mailto:${brand.orderEmail}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
      setError('Chưa gửi tự động được, đã mở ứng dụng email để bạn gửi thay.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form className={s.form} onSubmit={submit} noValidate>
      <p className={s.formIntro}>Để lại tên và số điện thoại, Ngọc Minh sẽ gọi lại xác nhận đơn và báo phí giao hàng.</p>
      <label className={s.formField}>
        <span>
          Tên của bạn <em>*</em>
        </span>
        <input type="text" autoComplete="name" required placeholder="Anh/chị…" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label className={s.formField}>
        <span>
          Số điện thoại <em>*</em>
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="0912 345 678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!error || undefined}
        />
      </label>
      {error && (
        <p className={s.formError} role="alert">
          {error}
        </p>
      )}
      <div className={s.formActions}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={sending}>
          Quay lại
        </Button>
        <Button type="submit" variant="primary" size="lg" loading={sending} icon={<Icons.IconMail size={18} />}>
          Đặt hàng
        </Button>
      </div>
    </form>
  );
}
