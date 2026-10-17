from typing import Dict, List, Any, Optional, Set
from collections import deque
import json
import datetime
from sqlalchemy.orm import Session
from app.db.models import Wallet, Transaction, TraceJob, TracePath, Alert, VaspEntity, WalletAttribution
from app.services.vasp_intelligence import VaspIntelligenceService
from app.services.risk_scoring import RiskScoringEngine

class TracingEngine:
    """Executes multi-hop transaction tracing and builds interactive fund-flow graph representations."""

    @staticmethod
    def execute_trace(db: Session, job: TraceJob) -> Dict[str, Any]:
        job.status = "RUNNING"
        job.progress_percent = 15
        job.started_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()

        root_addr = job.root_address.strip()
        network = job.network.upper()
        max_hops = job.max_depth or 3

        nodes: Dict[str, Dict[str, Any]] = {}
        edges: List[Dict[str, Any]] = []
        visited: Set[str] = set()
        queue = deque([(root_addr, 0)])

        job.progress_percent = 35
        db.commit()

        # Ensure root node is added
        root_wallet = db.query(Wallet).filter(
            Wallet.address.ilike(root_addr),
            Wallet.network == network
        ).first()

        root_attr = VaspIntelligenceService.identify_address(db, root_addr, network)

        nodes[root_addr] = {
            "id": root_addr,
            "address": root_addr,
            "network": network,
            "label": root_wallet.label if root_wallet and root_wallet.label else f"Suspect Wallet ({root_addr[:6]}...{root_addr[-4:]})",
            "entity_type": root_wallet.entity_type if root_wallet else "Suspect",
            "risk_score": root_wallet.risk_score if root_wallet else 85.0,
            "risk_level": root_wallet.risk_level if root_wallet else "Critical",
            "is_root": True,
            "vasp_name": root_attr["vasp_name"] if root_attr else None,
            "vasp_category": root_attr["vasp_category"] if root_attr else None,
            "confidence_level": root_attr["confidence_level"] if root_attr else None,
            "hop": 0
        }

        # Clear existing paths for this job if any
        db.query(TracePath).filter(TracePath.trace_job_id == job.id).delete()

        detected_vasps = set()
        suspicious_patterns = set()

        while queue:
            curr_addr, curr_hop = queue.popleft()
            if curr_hop >= max_hops or curr_addr in visited:
                continue
            visited.add(curr_addr)

            # Query outgoing transactions from this address on this network
            txs = db.query(Transaction).filter(
                Transaction.from_address.ilike(curr_addr),
                Transaction.network == network
            ).all()

            # Pattern detection flags
            if len(txs) > 3:
                suspicious_patterns.add("Fan-out Dispersion")
            
            for tx in txs:
                dest_addr = tx.to_address.strip()

                # Detect attribution for destination
                dest_attr = VaspIntelligenceService.identify_address(db, dest_addr, network)
                dest_wallet = db.query(Wallet).filter(
                    Wallet.address.ilike(dest_addr),
                    Wallet.network == network
                ).first()

                pattern_flag = tx.tx_type
                if dest_attr:
                    detected_vasps.add(dest_attr["vasp_name"])
                    pattern_flag = f"{dest_attr['vasp_name']} Deposit"

                # Record node if not present
                if dest_addr not in nodes:
                    entity_type = "Intermediary"
                    if dest_attr:
                        entity_type = "VASP_Deposit" if "Deposit" in dest_attr["attribution_type"] else "Exchange"
                    elif dest_wallet:
                        entity_type = dest_wallet.entity_type

                    nodes[dest_addr] = {
                        "id": dest_addr,
                        "address": dest_addr,
                        "network": network,
                        "label": (dest_attr["vasp_name"] + " Deposit") if dest_attr else (dest_wallet.label if dest_wallet and dest_wallet.label else f"Hop {curr_hop+1} ({dest_addr[:6]}...{dest_addr[-4:]})"),
                        "entity_type": entity_type,
                        "risk_score": dest_wallet.risk_score if dest_wallet else (75.0 if dest_attr else 45.0),
                        "risk_level": dest_wallet.risk_level if dest_wallet else ("High" if dest_attr else "Medium"),
                        "is_root": False,
                        "vasp_name": dest_attr["vasp_name"] if dest_attr else None,
                        "vasp_category": dest_attr["vasp_category"] if dest_attr else None,
                        "confidence_level": dest_attr["confidence_level"] if dest_attr else None,
                        "hop": curr_hop + 1
                    }

                # Record edge
                edge_id = f"edge-{tx.tx_hash[:12]}-{curr_addr[:4]}-{dest_addr[:4]}"
                edges.append({
                    "id": edge_id,
                    "source": curr_addr,
                    "target": dest_addr,
                    "tx_hash": tx.tx_hash,
                    "amount": tx.amount,
                    "asset": tx.asset_symbol,
                    "fee": tx.fee,
                    "timestamp": tx.timestamp.isoformat() if tx.timestamp else None,
                    "pattern_flag": pattern_flag,
                    "is_token": tx.is_token_transfer
                })

                # Save trace path record
                tp = TracePath(
                    trace_job_id=job.id,
                    hop_level=curr_hop + 1,
                    from_address=curr_addr,
                    to_address=dest_addr,
                    tx_hash=tx.tx_hash,
                    amount=tx.amount,
                    asset=tx.asset_symbol,
                    transfer_type=tx.tx_type,
                    timestamp=tx.timestamp,
                    pattern_flag=pattern_flag
                )
                db.add(tp)

                # Queue next hop if not an exchange terminal
                if not dest_attr and curr_hop + 1 < max_hops:
                    queue.append((dest_addr, curr_hop + 1))

        job.progress_percent = 90

        # Calculate shortest path to a VASP if any found
        shortest_path_to_vasp = []
        for n_addr, n_data in nodes.items():
            if n_data.get("vasp_name"):
                # Trace back from n_addr to root_addr
                path = [n_addr]
                curr = n_addr
                while curr != root_addr:
                    parent_edge = next((e for e in edges if e["target"] == curr), None)
                    if not parent_edge:
                        break
                    curr = parent_edge["source"]
                    path.append(curr)
                path.reverse()
                shortest_path_to_vasp = path
                break

        summary = {
            "root_address": root_addr,
            "network": network,
            "max_hops_configured": max_hops,
            "nodes_count": len(nodes),
            "edges_count": len(edges),
            "detected_vasps": list(detected_vasps),
            "suspicious_patterns": list(suspicious_patterns),
            "shortest_path_to_vasp": shortest_path_to_vasp,
            "completed_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        job.status = "COMPLETED"
        job.progress_percent = 100
        job.completed_at = datetime.datetime.now(datetime.timezone.utc)
        job.results_summary = json.dumps(summary)
        db.commit()

        return {
            "job_id": job.id,
            "status": "COMPLETED",
            "nodes": list(nodes.values()),
            "edges": edges,
            "summary": summary
        }
