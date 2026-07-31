import { notFound } from "next/navigation";
import { addActionItemAction, addCommentAction, updatePromiseAction } from "@/app/actions";
import { Badge, PageHeader } from "@/components/ui";
import { workflowStatuses } from "@/lib/constants";
import { requireUser } from "@/lib/auth";
import { recommendPromiseNextAction } from "@/lib/business/workflow";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function PromiseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [promise, users] = await Promise.all([
    prisma.extractedPromise.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        account: true,
        document: true,
        assignedOwner: true,
        matches: { include: { capability: true } },
        comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
        actionItems: { include: { owner: true } },
        timelineEvents: { include: { actor: true }, orderBy: { createdAt: "desc" } }
      }
    }),
    prisma.user.findMany({ where: { organizationId: user.organizationId } })
  ]);
  if (!promise) notFound();
  const match = promise.matches[0];
  const nextAction = recommendPromiseNextAction(promise, match ?? { gapType: "Needs product review", requiresHumanReview: true }, { numericScore: promise.riskScore });

  return (
    <>
      <PageHeader title="Promise detail" eyebrow={promise.account.name} description={promise.normalizedClaim} />
      <div className="comparison">
        <div className="card">
          <div className="eyebrow">Customer promise</div>
          <h2>{promise.promiseText}</h2>
          <p>Source: {promise.document?.title ?? "Manual"} at {promise.sourceLocation}</p>
          <p><Badge>{promise.extractionMethod} suggested</Badge> <Badge>{promise.needsHumanReview ? "Needs review" : "Human reviewed"}</Badge></p>
          <p>Confidence: {Math.round(promise.confidenceScore * 100)}%</p>
        </div>
        <div className="card">
          <div className="eyebrow">Product capability evidence</div>
          <h2>{match?.capability.name ?? "No verified match"}</h2>
          <p><Badge>{match?.gapType ?? "Needs product review"}</Badge> <Badge tone={match?.supportStatus}>{match?.supportStatus ?? "Unknown"}</Badge></p>
          <p>{match?.explanation ?? "No capability evidence is strong enough yet. Product review is required."}</p>
          <p>{match?.evidence}</p>
        </div>
      </div>
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <div className="card"><h3>Risk</h3><p><Badge tone={promise.riskLevel}>{promise.riskLevel} {promise.riskScore}</Badge></p><p>{promise.riskExplanation}</p></div>
        <div className="card"><h3>Workflow</h3><p>{promise.status}</p><p>Owner: {promise.assignedOwner?.name ?? "Unowned"}</p><p>Due: {formatDate(promise.dueDate)}</p></div>
        <div className="card"><h3>Recommended next action</h3><p>{nextAction}</p></div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>Update workflow</h2>
          <form className="form" action={updatePromiseAction}>
            <input type="hidden" name="promiseId" value={promise.id} />
            <label>Status<select name="status" defaultValue={promise.status}>{workflowStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Owner<select name="assignedOwnerId" defaultValue={promise.assignedOwnerId ?? ""}><option value="">Unowned</option>{users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
            <label><span><input type="checkbox" name="humanReviewed" /> Mark human reviewed</span></label>
            <button className="button" type="submit">Save promise</button>
          </form>
        </div>
        <div className="card">
          <h2>Create action item</h2>
          <form className="form" action={addActionItemAction}>
            <input type="hidden" name="promiseId" value={promise.id} />
            <input type="hidden" name="accountId" value={promise.accountId} />
            <label>Title<input name="title" defaultValue={`Resolve ${promise.category} promise`} /></label>
            <label>Description<textarea name="description" defaultValue={nextAction} /></label>
            <label>Owner<select name="ownerId"><option value="">Unassigned</option>{users.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
            <label>Due date<input name="dueDate" type="date" /></label>
            <label>Priority<select name="priority" defaultValue={promise.riskLevel}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <button className="button" type="submit">Add action item</button>
          </form>
        </div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card">
          <h2>Comments</h2>
          <form className="form" action={addCommentAction}>
            <input type="hidden" name="promiseId" value={promise.id} />
            <label>Comment<textarea name="comment" placeholder="Add product, sales, or customer clarification context." /></label>
            <button className="button secondary" type="submit">Add comment</button>
          </form>
          {promise.comments.map((comment) => <p key={comment.id}><strong>{comment.user.name}:</strong> {comment.comment}</p>)}
        </div>
        <div className="card">
          <h2>Timeline events</h2>
          {promise.timelineEvents.map((event) => <p key={event.id}><strong>{event.eventType}</strong> by {event.actor?.name ?? "System"} on {formatDate(event.createdAt)}<br />{event.description}</p>)}
        </div>
      </div>
    </>
  );
}
