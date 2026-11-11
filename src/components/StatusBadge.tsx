import type { ReservationStatus } from "../types";
import { STATUS_LABEL } from "../utils/rules";

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status]}</span>;
}
