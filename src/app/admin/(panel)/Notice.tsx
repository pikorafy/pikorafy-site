/** The ?ok= / ?error= message an admin action redirects back with. */
export default function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="adm-notice error" role="alert">{error}</p>;
  if (ok) return <p className="adm-notice ok" role="status">{ok}</p>;
  return null;
}
