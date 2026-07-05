"""Sanitized command catalog — mirrors the frontend mock (generic commands only)."""
from __future__ import annotations

from .models import CommandDefinition, CommandField

COMMAND_DEFINITIONS: list[CommandDefinition] = [
    CommandDefinition(
        id="cmd-data-sync",
        name="Data Sync",
        description="Synchronize datasets between configured stores with verification and rollback safety.",
        category="Data Operations",
        risk_level="medium",
        estimated_duration_sec=120,
        enabled=True,
        configurable_fields=[
            CommandField(key="targetEnvironment", label="Target Environment", type="select",
                         required=True, default_value="staging", options=["staging", "integration", "sandbox"],
                         description="Environment the sync runs against."),
            CommandField(key="batchSize", label="Batch Size", type="number", required=True,
                         default_value=500, description="Records per batch (100–5000)."),
            CommandField(key="dryRun", label="Dry Run", type="boolean", required=False,
                         default_value=True, description="Validate without applying changes."),
        ],
    ),
    CommandDefinition(
        id="cmd-health-scan",
        name="Health Scan",
        description="Run a full diagnostic sweep across registered subsystems.",
        category="Diagnostics",
        risk_level="low",
        estimated_duration_sec=45,
        enabled=True,
        configurable_fields=[
            CommandField(key="scope", label="Scan Scope", type="select", required=True,
                         default_value="standard", options=["quick", "standard", "deep"],
                         description="Depth of the diagnostic sweep."),
            CommandField(key="includeMetrics", label="Collect Metrics", type="boolean",
                         required=False, default_value=True, description="Attach performance metrics."),
        ],
    ),
    CommandDefinition(
        id="cmd-report-generation",
        name="Report Generation",
        description="Generate an operational summary report for a selected period.",
        category="Reporting",
        risk_level="low",
        estimated_duration_sec=90,
        enabled=True,
        configurable_fields=[
            CommandField(key="period", label="Reporting Period", type="select", required=True,
                         default_value="last-7-days", options=["last-24-hours", "last-7-days", "last-30-days"],
                         description="Time window covered by the report."),
            CommandField(key="format", label="Output Format", type="select", required=True,
                         default_value="pdf", options=["pdf", "html", "csv"], description="Rendered output format."),
        ],
    ),
    CommandDefinition(
        id="cmd-batch-validation",
        name="Batch Validation",
        description="Validate queued batches against schema and integrity rules.",
        category="Data Operations",
        risk_level="medium",
        estimated_duration_sec=180,
        enabled=True,
        configurable_fields=[
            CommandField(key="validationLevel", label="Validation Level", type="select", required=True,
                         default_value="strict", options=["lenient", "standard", "strict"],
                         description="Rule set applied to each batch."),
            CommandField(key="maxBatches", label="Max Batches", type="number", required=True,
                         default_value=10, description="Upper limit of batches to validate."),
        ],
    ),
    CommandDefinition(
        id="cmd-configuration-check",
        name="Configuration Check",
        description="Compare active configuration against the approved baseline.",
        category="Diagnostics",
        risk_level="low",
        estimated_duration_sec=30,
        enabled=True,
        configurable_fields=[
            CommandField(key="baseline", label="Baseline Version", type="text", required=True,
                         default_value="baseline-current", description="Baseline to compare against."),
        ],
    ),
    CommandDefinition(
        id="cmd-simulation-run",
        name="Simulation Run",
        description="Execute a controlled simulation scenario in an isolated sandbox environment.",
        category="Simulation",
        risk_level="high",
        estimated_duration_sec=300,
        enabled=True,
        configurable_fields=[
            CommandField(key="scenario", label="Scenario", type="select", required=True,
                         default_value="load-profile-a", options=["load-profile-a", "load-profile-b", "failover-drill"],
                         description="Predefined sanitized scenario."),
            CommandField(key="iterations", label="Iterations", type="number", required=True,
                         default_value=3, description="Number of simulation iterations (1–10)."),
            CommandField(key="captureTrace", label="Capture Trace", type="boolean", required=False,
                         default_value=True, description="Record a detailed execution trace."),
        ],
    ),
]

COMMANDS_BY_ID: dict[str, CommandDefinition] = {c.id: c for c in COMMAND_DEFINITIONS}
