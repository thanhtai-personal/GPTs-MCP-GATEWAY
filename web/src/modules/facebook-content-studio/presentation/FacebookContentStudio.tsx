import { CalendarClock, CheckCircle2, Clock3, ImagePlus, LoaderCircle, Send, ShieldCheck, Video, Facebook, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveFacebookDraft, createFacebookDraft, listFacebookPages, listFacebookPosts, type FacebookPagePost, type FacebookPostStatus } from "@/modules/facebook-content-studio/api/facebook-content-studio.api";
import "./FacebookContentStudio.css";

const STATUS_LABEL: Record<FacebookPostStatus, string> = {
  draft: "Bản nháp", scheduled: "Đã lên lịch", publishing: "Đang đăng",
  published: "Đã đăng", failed: "Thất bại", needs_review: "Cần kiểm tra",
};

export function FacebookContentStudio({ accessToken }: { accessToken: string }) {
  const client = useQueryClient();
  const [pageId, setPageId] = useState("");
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "image" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const pages = useQuery({ queryKey: ["facebook-pages"], queryFn: () => listFacebookPages(accessToken), enabled: Boolean(accessToken) });
  const posts = useQuery({ queryKey: ["facebook-page-posts", filter], queryFn: () => listFacebookPosts(accessToken, filter === "all" ? undefined : filter), enabled: Boolean(accessToken), refetchInterval: 30000 });
  const selectedPage = pages.data?.data.find((page) => page.id === pageId) ?? pages.data?.data[0];
  const rows = posts.data?.posts ?? [];
  const create = useMutation({
    mutationFn: () => createFacebookDraft(accessToken, { pageId: selectedPage?.id ?? "", message: message.trim(), mediaType, ...(mediaType !== "text" ? { mediaUrl: mediaUrl.trim() } : {}) }),
    onSuccess: async () => { setMessage(""); setMediaUrl(""); setNotice("Đã lưu bản nháp. Hãy kiểm tra nội dung và bản xem trước trước khi duyệt."); await client.invalidateQueries({ queryKey: ["facebook-page-posts"] }); },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Không thể tạo bản nháp"),
  });
  const approve = useMutation({
    mutationFn: ({ id, schedule }: { id: string; schedule?: string }) => approveFacebookDraft(accessToken, id, schedule),
    onSuccess: async () => { setNotice("Đã duyệt. Bài sẽ được worker xử lý theo lịch đã chọn."); setScheduledAt(""); await client.invalidateQueries({ queryKey: ["facebook-page-posts"] }); },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Không thể duyệt bài"),
  });
  const stats = useMemo(() => ({ draft: rows.filter(x => x.status === "draft").length, scheduled: rows.filter(x => x.status === "scheduled").length, published: rows.filter(x => x.status === "published").length }), [rows]);
  const canCreate = Boolean(selectedPage && message.trim() && (mediaType === "text" || /^https:\/\//i.test(mediaUrl.trim())));
  if (pages.isLoading) return <div className="fb-studio-loading"><LoaderCircle className="spin" /> Đang tải Facebook Pages…</div>;
  if (pages.error) return <section className="fb-studio"><div className="notice error">Không tải được Pages. Hãy kết nối Facebook trong MCP Services và cấp quyền Page publishing. {pages.error.message}</div></section>;
  if (!pages.data?.data.length) return <section className="fb-studio"><div className="fb-empty"><Facebook size={30}/><h3>Chưa tìm thấy Facebook Page</h3><p>Kết nối tài khoản Facebook có quyền quản lý nội dung Page trong MCP Services.</p></div></section>;

  return <section className="fb-studio">
    <header className="fb-studio__heading"><div><span className="eyebrow">SOCIAL PUBLISHING · META GRAPH API</span><h1>Facebook Content Studio</h1><p>Tạo nội dung, xem trước, duyệt và quản lý lịch đăng trên các Page của bạn.</p></div><button className="secondary" onClick={() => { void pages.refetch(); void posts.refetch(); }}><RefreshCw size={15}/> Làm mới</button></header>
    <div className="fb-stats"><div><span>BẢN NHÁP</span><strong>{stats.draft}</strong></div><div><span>ĐÃ LÊN LỊCH</span><strong>{stats.scheduled}</strong></div><div><span>ĐÃ ĐĂNG</span><strong>{stats.published}</strong></div><div><span>TỔNG BÀI</span><strong>{rows.length}</strong></div></div>
    <div className="fb-studio__grid">
      <section className="card fb-compose"><div className="fb-section-title"><div><span className="eyebrow">COMPOSER</span><h2>Tạo bài viết</h2></div><span className="fb-safe"><ShieldCheck size={14}/> Duyệt trước khi đăng</span></div>
        <label>Facebook Page<select value={selectedPage?.id ?? ""} onChange={e => setPageId(e.target.value)}>{pages.data.data.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <div className="fb-media-tabs">{(["text","image","video"] as const).map(type => <button type="button" key={type} className={mediaType === type ? "active" : "secondary"} onClick={() => setMediaType(type)}>{type === "text" ? <Send size={15}/> : type === "image" ? <ImagePlus size={15}/> : <Video size={15}/>} {type === "text" ? "Văn bản" : type === "image" ? "Ảnh" : "Video"}</button>)}</div>
        <label>Nội dung bài viết<textarea rows={7} maxLength={5000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Bạn muốn chia sẻ điều gì với người theo dõi?"/></label>
        <div className="fb-char-count">{message.length}/5.000 ký tự</div>
        {mediaType !== "text" ? <label>URL {mediaType === "image" ? "ảnh" : "video"} công khai (HTTPS)<input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://cdn.example.com/media.jpg"/></label> : null}
        <div className="fb-compose__actions"><button disabled={!canCreate || create.isPending} onClick={() => create.mutate()}>{create.isPending ? <LoaderCircle className="spin" size={16}/> : <Send size={16}/>} Lưu bản nháp</button><span>Chưa đăng lên Page</span></div>
        {notice ? <p className="fb-notice" role="status">{notice}</p> : null}
      </section>
      <section className="card fb-preview"><div className="fb-section-title"><div><span className="eyebrow">LIVE PREVIEW</span><h2>Xem trước bài viết</h2></div><span className="fb-preview__network"><Facebook size={15}/> Facebook</span></div>
        <div className="fb-preview__post"><div className="fb-preview__identity"><span className="fb-avatar"><Facebook size={18}/></span><div><strong>{selectedPage?.name}</strong><small>Đang xem trước · Chỉ mình bạn</small></div></div><p className="fb-preview__message">{message || "Nội dung bài viết sẽ hiển thị tại đây…"}</p>
          {mediaType === "image" && mediaUrl ? <img className="fb-preview__media" src={mediaUrl} alt="Ảnh xem trước" onError={e => { e.currentTarget.style.display = "none"; }}/> : null}
          {mediaType === "video" && mediaUrl ? <video className="fb-preview__media" src={mediaUrl} controls preload="metadata"/> : null}
          {mediaType !== "text" && !mediaUrl ? <div className="fb-preview__placeholder">{mediaType === "image" ? <ImagePlus/> : <Video/>}<span>Thêm URL media HTTPS để xem trước</span></div> : null}
          <div className="fb-preview__footer"><span>Thích</span><span>Bình luận</span><span>Chia sẻ</span></div>
        </div>
        <p className="fb-preview__hint">Bản xem trước tham khảo; bố cục thực tế có thể khác theo thiết bị và định dạng của Meta.</p>
      </section>
    </div>
    <section className="card fb-queue"><div className="fb-section-title"><div><span className="eyebrow">PUBLISHING QUEUE</span><h2>Quản lý bài viết & lịch đăng</h2></div><CalendarClock size={20}/></div>
      <div className="fb-queue__toolbar"><div className="fb-filter">{[["all","Tất cả"],["draft","Bản nháp"],["scheduled","Đã lên lịch"],["published","Đã đăng"],["failed","Thất bại"],["needs_review","Cần kiểm tra"]].map(([key,label]) => <button key={key} className={filter === key ? "active" : "secondary"} onClick={() => setFilter(key)}>{label}</button>)}</div><button className="secondary" onClick={() => void posts.refetch()}><RefreshCw size={14}/></button></div>
      {posts.isLoading ? <p className="muted">Đang tải danh sách bài viết…</p> : posts.error ? <p className="notice error">{posts.error.message}</p> : rows.length === 0 ? <div className="fb-queue__empty">Chưa có bài viết trong mục này.</div> : <div className="fb-post-list">{rows.map((post: FacebookPagePost) => <article className="fb-post-row" key={post.id}><div className="fb-post-row__icon">{post.mediaType === "image" ? <ImagePlus/> : post.mediaType === "video" ? <Video/> : <Send/>}</div><div className="fb-post-row__body"><strong>{post.message.slice(0,110) || "(Không có nội dung)"}{post.message.length > 110 ? "…" : ""}</strong><small>{pages.data?.data.find(page => page.id === post.pageId)?.name ?? post.pageId} · {post.mediaType.toUpperCase()} · {new Date(post.createdAt).toLocaleString()}</small>{post.scheduledAt ? <small><Clock3 size={12}/> Lịch: {new Date(post.scheduledAt).toLocaleString()}</small> : null}{post.lastErrorCode ? <small className="fb-error">{post.lastErrorCode}</small> : null}</div><span className={`fb-status fb-status--${post.status}`}>{STATUS_LABEL[post.status]}</span>
        {post.status === "draft" ? <div className="fb-approve"><label>Lịch đăng (để trống = đăng sớm nhất)<input aria-label="Thời gian đăng" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}/></label><button disabled={approve.isPending} onClick={() => { const confirmed = window.confirm("Duyệt bài này để Gateway đăng lên Facebook Page? Hãy chắc chắn nội dung và Page đã đúng."); if (confirmed) approve.mutate({ id: post.id, ...(scheduledAt ? { schedule: new Date(scheduledAt).toISOString() } : {}) }); }}><CheckCircle2 size={14}/> Duyệt & lên lịch</button></div> : null}
      </article>)}</div>}
    </section>
    <p className="fb-footnote"><ShieldCheck size={14}/> Gateway chỉ đăng sau thao tác duyệt. Bài có kết quả Meta không rõ ràng sẽ chuyển sang “Cần kiểm tra”, không tự đăng lại để tránh trùng lặp.</p>
  </section>;
}
