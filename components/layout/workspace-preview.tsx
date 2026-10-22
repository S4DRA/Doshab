/** Static illustration; no fabricated live presence or interactive controls. */
export function WorkspacePreview() {
  return <figure className="val-workspace-preview">
    <div className="val-preview-frame">
      <div className="val-preview-sidebar"><span className="val-preview-wordmark">VAL<span>YOUR CORNER.</span></span><span className="val-preview-nav-active">↗ &nbsp; Your spaces</span><span>☷ &nbsp; Messages</span><span>＋ &nbsp; Friends</span><div className="val-preview-sidebar-note">People.<br />Ideas.<br />Further<span>.</span></div></div>
      <div className="val-preview-workspace">
        <div className="val-preview-topline"><span>YOUR SPACE / THE COMMON ROOM</span><span>ILLUSTRATIVE PREVIEW</span></div>
        <div className="val-preview-content"><div className="val-preview-welcome"><p>GOOD TO SEE YOU.</p><h3>SAME PEOPLE.<br />NEW POSSIBILITIES<span>.</span></h3><p>A room for the plans, the ideas, and everything in between.</p></div><div className="val-preview-room"><span className="val-preview-room-number">01 / VOICE ROOM</span><h4>The lounge</h4><div className="val-preview-avatars"><span>J</span><span>M</span><span>A</span></div><p>A place to drop in.</p></div><div className="val-preview-conversation"><div className="val-preview-conversation-header"><span># &nbsp; everyday</span><span>TEXT CHANNEL</span></div><div className="val-preview-message"><span className="val-preview-avatar">M</span><div><b>Mara</b><p>Same time, same place?</p></div></div><div className="val-preview-message"><span className="val-preview-avatar val-preview-avatar-dark">J</span><div><b>Jules</b><p>I’ll bring the ideas. You bring the company.</p></div></div></div></div>
      </div>
    </div>
    <figcaption><span>YOUR PEOPLE. YOUR PACE.</span><span>A look inside VAL · Example conversations</span></figcaption>
  </figure>;
}
