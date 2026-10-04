"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";

export function MobileCreateSpace() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const params = useSearchParams();
  const review = params.get("step") === "review" && name.trim().length > 0;
  const heading = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (review) heading.current?.focus({ preventScroll: true });
  }, [review]);
  const editDetails = () => {
    if (history.state?.valCreateReview === location.pathname) history.back();
    else {
      const target = new URL(location.href);
      target.searchParams.delete("step");
      history.replaceState(null, "", target);
    }
  };
  return <main className="app-page-scroll"><div className="val-mobile-page val-create-page">
    <MobileHeading title="Create your space" action={<Link className="val-mobile-icon-button" href="/dashboard/channels" aria-label="Close create space"><MobileIcon name="close" /></Link>} />
    <ol className="val-mobile-progress" aria-label="Create space progress" ref={heading} tabIndex={-1}><li aria-current={!review ? "step" : undefined}>1 · Details</li><li aria-current={review ? "step" : undefined}>2 · Review</li></ol>
    <form action="/api/groups" method="post" onSubmit={(event) => {
      if (!name.trim()) {
        event.preventDefault();
        const input = event.currentTarget.elements.namedItem("name") as HTMLInputElement;
        input.setCustomValidity("Enter a space name.");
        input.reportValidity();
        return;
      }
      if (review) return;
      event.preventDefault();
      const target = new URL(location.href);
      target.searchParams.set("step", "review");
      // Next adds its own history fields. Copying them would bypass its URL update.
      const state = { valCreateReview: location.pathname };
      if (params.get("step") === "review") history.replaceState(state, "", target);
      else history.pushState(state, "", target);
    }}>
      <MobileSection title={review ? "Ready for your people" : "Space details"}>
        <div hidden={review} className="val-mobile-form-fields"><label>Space name<input name="name" required maxLength={80} value={name} onChange={(event) => { event.target.setCustomValidity(""); setName(event.target.value); }} placeholder="Weekend crew" /><small>{name.length}/80</small></label><label>Purpose<textarea name="description" maxLength={180} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What brings you together?" rows={3} /><small>{description.length}/180</small></label></div>
        {review && <div className="val-mobile-review"><h2>{name}</h2><p>{description || "A place for your people."}</p><p>Your space starts with #general and a Voice lounge. Add its photo and invite friends from Space settings after creating it.</p><button className="val-mobile-text-button" type="button" onClick={editDetails}>Edit details</button></div>}
      </MobileSection>
      <SubmitButton className="val-mobile-primary val-mobile-create-submit" pendingText="Creating space…">{review ? "Create space →" : "Review your space →"}</SubmitButton>
    </form>
  </div></main>;
}
