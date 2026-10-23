import type {
  RatioResult,
  WaterBalanceResult,
  DebrisInput,
  DebrisResult,
  WindInput,
  WindResult,
  EvidenceClass,
} from "../types";

/**
 * validateRatio - ETa/ETo ratio with denominator threshold
 * Protects near-zero denominator, keeps classes separate.
 * Preserves "unavailable" instead of zeroing.
 */
export function validateRatio(
  eta: string,
  eto: string,
  threshold: number = 0.1
): RatioResult {
  // Check for unavailable values
  if (eta === "unavailable" || eta === "") {
    return {
      value: "unavailable",
      unit: "unitless",
      class: "unavailable" as EvidenceClass,
      reason: "ETa is unavailable",
    };
  }
  if (eto === "unavailable" || eto === "") {
    return {
      value: "unavailable",
      unit: "unitless",
      class: "unavailable" as EvidenceClass,
      reason: "ETo is unavailable",
    };
  }

  const etaNum = parseFloat(eta);
  const etoNum = parseFloat(eto);

  if (isNaN(etaNum)) {
    return {
      value: "unavailable",
      unit: "unitless",
      class: "unavailable" as EvidenceClass,
      reason: "ETa is not a valid number",
    };
  }
  if (isNaN(etoNum)) {
    return {
      value: "unavailable",
      unit: "unitless",
      class: "unavailable" as EvidenceClass,
      reason: "ETo is not a valid number",
    };
  }

  // Denominator threshold protection
  if (etoNum < threshold) {
    return {
      value: "unavailable",
      unit: "unitless",
      class: "comparison" as EvidenceClass,
      reason: `denominator (ETo=${etoNum}) below threshold (${threshold})`,
    };
  }

  const ratio = etaNum / etoNum;
  return {
    value: Math.round(ratio * 1000) / 1000,
    unit: "unitless",
    class: "comparison" as EvidenceClass,
  };
}

/**
 * checkWaterBalance - Residual check
 * precipitation + irrigation + inflows - ETa - outflows
 * Same support/interval required; residual stays residual.
 */
export function checkWaterBalance(terms: {
  precipitation: string;
  irrigation: string;
  inflows: string;
  et: string;
  outflows: string;
}): WaterBalanceResult {
  const { precipitation, irrigation, inflows, et, outflows } = terms;

  // Check for any unavailable terms
  const allTerms = [precipitation, irrigation, inflows, et, outflows];
  const unavailableTerms: string[] = [];

  if (precipitation === "unavailable" || precipitation === "")
    unavailableTerms.push("precipitation");
  if (irrigation === "unavailable" || irrigation === "")
    unavailableTerms.push("irrigation");
  if (inflows === "unavailable" || inflows === "")
    unavailableTerms.push("inflows");
  if (et === "unavailable" || et === "") unavailableTerms.push("ETa");
  if (outflows === "unavailable" || outflows === "")
    unavailableTerms.push("outflows");

  if (unavailableTerms.length > 0) {
    return {
      residual: "unavailable",
      status: "blocked - missing term(s): " + unavailableTerms.join(", "),
      class: "unavailable" as EvidenceClass,
      details: `Cannot compute balance without: ${unavailableTerms.join(", ")}`,
    };
  }

  const P = parseFloat(precipitation);
  const I = parseFloat(irrigation);
  const Inf = parseFloat(inflows);
  const ETa = parseFloat(et);
  const Qout = parseFloat(outflows);

  if ([P, I, Inf, ETa, Qout].some(isNaN)) {
    return {
      residual: "unavailable",
      status: "blocked - invalid numeric input",
      class: "unavailable" as EvidenceClass,
      details: "One or more terms could not be parsed as numbers",
    };
  }

  const residual = P + I + Inf - ETa - Qout;
  return {
    residual: Math.round(residual * 100) / 100,
    status: "estimated",
    class: "estimated" as EvidenceClass,
    details: `P(${P}) + I(${I}) + Inf(${Inf}) - ETa(${ETa}) - Qout(${Qout}) = ${Math.round(residual * 100) / 100} mm`,
  };
}

/**
 * Debris separator - volume vs type vs density vs estimated mass vs measured mass
 */
export function validateDebris(input: DebrisInput): DebrisResult {
  const { volume, type, density, estimatedMass, measuredMass } = input;

  // Compute estimated mass from volume * density
  let computedEstimated: string | number = "unavailable";
  let measured: string | number = "unavailable";
  let discrepancy: string | number = "unavailable";
  let status = "incomplete";
  let evidenceClass: EvidenceClass = "unavailable";

  if (volume !== "" && volume !== "unavailable" && density !== "" && density !== "unavailable") {
    const volNum = parseFloat(volume);
    const densNum = parseFloat(density);
    if (!isNaN(volNum) && !isNaN(densNum)) {
      computedEstimated = Math.round(volNum * densNum * 100) / 100;
    }
  } else if (estimatedMass !== "" && estimatedMass !== "unavailable") {
    computedEstimated = parseFloat(estimatedMass);
    if (isNaN(computedEstimated as number)) computedEstimated = "unavailable";
  }

  if (measuredMass !== "" && measuredMass !== "unavailable") {
    measured = parseFloat(measuredMass);
    if (isNaN(measured as number)) measured = "unavailable";
  }

  // Compute discrepancy
  if (computedEstimated !== "unavailable" && measured !== "unavailable") {
    discrepancy =
      Math.round(
        (Math.abs((computedEstimated as number) - (measured as number)) /
          (measured as number)) *
          10000
      ) / 100;
    if ((discrepancy as number) > 50) {
      status = "large discrepancy - review density assumption or measurement";
      evidenceClass = "comparison";
    } else if ((discrepancy as number) > 20) {
      status = "moderate discrepancy - estimated with caution";
      evidenceClass = "comparison";
    } else {
      status = "consistent";
      evidenceClass = "comparison";
    }
  } else if (computedEstimated !== "unavailable") {
    status = "estimated only - no measured mass for comparison";
    evidenceClass = "estimated";
  } else {
    status = "insufficient data";
    evidenceClass = "unavailable";
  }

  return {
    estimatedMass: computedEstimated,
    measuredMass: measured,
    discrepancy,
    status,
    class: evidenceClass,
  };
}

/**
 * Wind separator - surface wind with height/gust duration vs atmospheric context vs damage observation
 */
export function validateWind(input: WindInput): WindResult {
  const { surfaceWind, height, gustDuration, atmosphericContext, damageObservation } = input;

  if (surfaceWind === "" || surfaceWind === "unavailable") {
    return {
      adjustedWind: "unavailable",
      classification: "unknown",
      consistencyWithDamage: "cannot assess - no wind data",
      status: "blocked - missing surface wind",
      class: "unavailable",
    };
  }

  const windNum = parseFloat(surfaceWind);
  if (isNaN(windNum)) {
    return {
      adjustedWind: "unavailable",
      classification: "unknown",
      consistencyWithDamage: "cannot assess - invalid wind value",
      status: "blocked - invalid wind value",
      class: "unavailable",
    };
  }

  // Height adjustment (logarithmic wind profile approximation)
  let adjustedWind = windNum;
  const heightNum = height !== "" ? parseFloat(height) : 10; // default 10m
  if (!isNaN(heightNum) && heightNum > 0 && heightNum !== 10) {
    // Adjust from measurement height to standard 10m using log law
    adjustedWind = windNum * (Math.log(10 / 0.1) / Math.log(heightNum / 0.1));
    adjustedWind = Math.round(adjustedWind * 100) / 100;
  }

  // Gust duration factor
  let gustFactor = 1.0;
  if (gustDuration !== "" && gustDuration !== "unavailable") {
    const durNum = parseFloat(gustDuration);
    if (!isNaN(durNum)) {
      if (durNum < 3) gustFactor = 1.5;
      else if (durNum < 10) gustFactor = 1.3;
      else if (durNum < 60) gustFactor = 1.15;
      else gustFactor = 1.0;
    }
  }

  const peakWind = Math.round(adjustedWind * gustFactor * 100) / 100;

  // Classification based on Beaufort-like scale
  let classification = "unknown";
  if (peakWind < 5.5) classification = "light (Beaufort 0-3)";
  else if (peakWind < 10.8) classification = "moderate (Beaufort 4-5)";
  else if (peakWind < 17.2) classification = "strong (Beaufort 6-7)";
  else if (peakWind < 24.5) classification = "gale (Beaufort 8)";
  else if (peakWind < 32.7) classification = "strong gale (Beaufort 9)";
  else if (peakWind < 50) classification = "storm (Beaufort 10-11)";
  else classification = "hurricane force (Beaufort 12+)";

  // Consistency with damage observation
  let consistency = "not assessed";
  if (damageObservation && damageObservation !== "") {
    const damageLower = damageObservation.toLowerCase();
    if (damageLower.includes("no damage") || damageLower.includes("none")) {
      if (peakWind < 10.8) consistency = "consistent - no damage expected at this wind speed";
      else consistency = "INCONSISTENT - damage expected but none observed; check wind source";
    } else if (damageLower.includes("tree") || damageLower.includes("branch")) {
      if (peakWind >= 13.9) consistency = "consistent - tree/branch damage expected at this wind speed";
      else consistency = "partially consistent - minor tree damage possible but verify";
    } else if (damageLower.includes("structural") || damageLower.includes("roof")) {
      if (peakWind >= 24.5) consistency = "consistent - structural damage expected at this wind speed";
      else consistency = "INCONSISTENT - structural damage at this wind speed is unusual; verify data";
    } else {
      consistency = "damage noted but classification uncertain - manual review needed";
    }
  }

  // Atmospheric context check
  let status = "estimated";
  if (atmosphericContext && atmosphericContext !== "") {
    const ctxLower = atmosphericContext.toLowerCase();
    if (ctxLower.includes("stable") && peakWind > 20) {
      status = "warning - high wind in stable atmosphere is unusual, verify";
    } else if (ctxLower.includes("frontal") || ctxLower.includes("convective")) {
      status = "consistent with synoptic context";
    } else {
      status = "estimated - atmospheric context noted";
    }
  }

  return {
    adjustedWind: peakWind,
    classification,
    consistencyWithDamage: consistency,
    status,
    class: "estimated",
  };
}

/**
 * Generate a plain-language report from all validation results
 */
export function generateReport(data: {
  ratio: RatioResult | null;
  waterBalance: WaterBalanceResult | null;
  debris: DebrisResult | null;
  wind: WindResult | null;
}): string {
  const lines: string[] = [];
  lines.push("=== SKYNET EVIDENCE WORKBENCH — TRIAGE REPORT ===");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // ETa/ETo Ratio
  lines.push("--- ETa/ETo Ratio ---");
  if (data.ratio) {
    if (data.ratio.value === "unavailable") {
      lines.push(`  Result: UNAVAILABLE`);
      lines.push(`  Reason: ${data.ratio.reason}`);
      lines.push(`  Evidence Class: ${data.ratio.class}`);
    } else {
      lines.push(`  Result: ${data.ratio.value} (${data.ratio.unit})`);
      lines.push(`  Evidence Class: ${data.ratio.class}`);
      if ((data.ratio.value as number) > 1.2) {
        lines.push(`  Note: Ratio > 1.2 suggests ETa may exceed reference — verify inputs.`);
      } else if ((data.ratio.value as number) < 0.3) {
        lines.push(`  Note: Ratio < 0.3 suggests severe water limitation or measurement error.`);
      }
    }
  } else {
    lines.push("  No data provided.");
  }
  lines.push("");

  // Water Balance
  lines.push("--- Water Balance Residual ---");
  if (data.waterBalance) {
    if (data.waterBalance.residual === "unavailable") {
      lines.push(`  Result: UNAVAILABLE`);
      lines.push(`  Status: ${data.waterBalance.status}`);
      lines.push(`  Evidence Class: ${data.waterBalance.class}`);
    } else {
      lines.push(`  Residual: ${data.waterBalance.residual} mm`);
      lines.push(`  Status: ${data.waterBalance.status}`);
      lines.push(`  Evidence Class: ${data.waterBalance.class}`);
      lines.push(`  Detail: ${data.waterBalance.details}`);
      if (Math.abs(data.waterBalance.residual as number) > 50) {
        lines.push(`  Warning: Large residual — check for missing terms or measurement error.`);
      }
    }
  } else {
    lines.push("  No data provided.");
  }
  lines.push("");

  // Debris
  lines.push("--- Debris Mass Assessment ---");
  if (data.debris) {
    lines.push(`  Estimated Mass: ${data.debris.estimatedMass} kg`);
    lines.push(`  Measured Mass: ${data.debris.measuredMass} kg`);
    lines.push(`  Discrepancy: ${data.debris.discrepancy}${typeof data.debris.discrepancy === "number" ? "%" : ""}`);
    lines.push(`  Status: ${data.debris.status}`);
    lines.push(`  Evidence Class: ${data.debris.class}`);
  } else {
    lines.push("  No data provided.");
  }
  lines.push("");

  // Wind
  lines.push("--- Wind/Damage Consistency ---");
  if (data.wind) {
    if (data.wind.adjustedWind === "unavailable") {
      lines.push(`  Result: UNAVAILABLE`);
      lines.push(`  Status: ${data.wind.status}`);
    } else {
      lines.push(`  Peak Adjusted Wind: ${data.wind.adjustedWind} m/s`);
      lines.push(`  Classification: ${data.wind.classification}`);
      lines.push(`  Damage Consistency: ${data.wind.consistencyWithDamage}`);
      lines.push(`  Status: ${data.wind.status}`);
      lines.push(`  Evidence Class: ${data.wind.class}`);
    }
  } else {
    lines.push("  No data provided.");
  }
  lines.push("");
  lines.push("--- End of Report ---");
  lines.push("Note: All values preserve 'unavailable' status rather than being zeroed.");
  lines.push("No external actions were taken. This is a local triage assessment only.");

  return lines.join("\n");
}
