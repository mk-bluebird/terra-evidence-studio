-- SPDX-License-Identifier: MIT OR Apache-2.0
-- Run from the repository root: lua tests/test_fieldledger.lua

package.path = "./lua/?.lua;" .. package.path

local ledger = require("fieldledger")
local passed = 0

local function check(condition, message)
    assert(condition, message)
    passed = passed + 1
end

local function near(actual, expected)
    return math.abs(actual - expected) < 1e-9
end

local function q(value, unit, lower, upper)
    return ledger.quantity(value, unit, lower, upper)
end

local function support()
    return {
        period = "synthetic_shared_period",
        spatial_support = "synthetic_shared_plot",
        method = "synthetic_compatibility_fixture",
        compatibility_reviewed = true,
    }
end

check(not ledger.is_finite(0 / 0), "NaN must be rejected")
check(not ledger.is_finite(math.huge), "Infinity must be rejected")
check(ledger.is_finite(0), "Zero must remain valid")

check(q(0, "mm").state == "available", "Zero is not missing")
check(q("12", "mm").state == "invalid", "No implicit number coercion")
check(q(12, "mm", 13, 14).state == "invalid", "Bounds must enclose value")
check(q(12, "mm", 10, nil).state == "invalid", "Bounds must be paired")
check(
    ledger.validate_quantity(q(2, "m"), { unit = "mm" }).state == "invalid",
    "Units must match"
)
check(
    ledger.validate_quantity(
        q(0, "mm", -1, 1), { minimum = 0 }
    ).state == "invalid",
    "Bounds must obey domain constraints"
)

local unknown = ledger.unavailable("Not measured")
check(unknown.state == "unavailable", "Missing state retained")
check(unknown.value == nil, "Missing value must not become zero")

local ratio_input = {
    actual = q(20, "mm", 18, 22),
    reference = q(40, "mm", 38, 42),
    minimum_reference = 0.1,
    support = support(),
}
local ratio = ledger.validate_ratio(ratio_input)
check(ratio.state == "available", "Ratio should calculate")
check(near(ratio.value, 0.5), "Ratio central estimate")
check(near(ratio.lower, 18 / 42), "Ratio lower bound")
check(near(ratio.upper, 22 / 38), "Ratio upper bound")

ratio_input.reference = q(0, "mm")
check(
    ledger.validate_ratio(ratio_input).state == "unavailable",
    "Zero denominator must not calculate"
)
ratio_input.reference = q(40, "mm")
ratio_input.support.compatibility_reviewed = false
check(
    ledger.validate_ratio(ratio_input).state == "unavailable",
    "Compatibility review is required"
)

local balance = {
    support = support(),
    boundaries_reviewed = true,
    tolerance_mm = 0.1,
    precipitation = q(10, "mm", 10, 10),
    irrigation = q(0, "mm", 0, 0),
    lateral_inflow = q(0, "mm", 0, 0),
    groundwater_inflow = q(0, "mm", 0, 0),
    actual_et = q(4, "mm", 4, 4),
    surface_outflow = q(1, "mm", 1, 1),
    drainage_outflow = q(2, "mm", 2, 2),
    groundwater_outflow = q(0, "mm", 0, 0),
    storage_change = q(3, "mm", 3, 3),
}
local residual = ledger.check_water_balance(balance)
check(near(residual.value, 0), "Balance must close for fixture")
check(
    residual.assessment == "entire_interval_within_tolerance",
    "Bounded assessment must use interval"
)
balance.groundwater_inflow = unknown
check(
    ledger.check_water_balance(balance).state == "unavailable",
    "Unknown flux must not silently become zero"
)
balance.groundwater_inflow = q(0, "mm", 0, 0)

local debris = {
    volume = q(10, "m3", 8, 12),
    density = q(100, "kg/m3", 80, 120),
    material = "vegetative",
    density_material = "vegetative",
    volume_basis = "loose_pile",
    density_volume_basis = "loose_pile",
    density_applicability_reviewed = true,
}
local mass = ledger.estimate_debris_mass(debris)
check(near(mass.value, 1000), "Mass central estimate")
check(near(mass.lower, 640), "Mass lower bound")
check(near(mass.upper, 1440), "Mass upper bound")
check(mass.measured_mass == false, "Estimate is not measured mass")

debris.density_volume_basis = "solid_material"
check(
    ledger.estimate_debris_mass(debris).state == "invalid",
    "Incompatible volume definitions must fail"
)
debris.density_volume_basis = "loose_pile"
debris.volume = q(1e308, "m3")
debris.density = q(1e308, "kg/m3")
check(
    ledger.estimate_debris_mass(debris).state == "invalid",
    "Overflow must not produce an available result"
)
debris.volume = q(10, "m3", 8, 12)
debris.density = q(100, "kg/m3", 80, 120)

local wind = {
    gust = q(20, "m/s"),
    height = q(10, "m"),
    gust_duration = q(3, "s"),
    exposure_reviewed = true,
    event_coverage_reviewed = true,
}
local gust = ledger.validate_wind(wind)
check(gust.state == "available", "Wind fixture should validate")
check(gust.causal_attribution == "not_assessed", "No causal inference")

wind.gust_duration = q(0, "s")
check(
    ledger.validate_wind(wind).state == "invalid",
    "Gust duration must be positive"
)
wind.gust_duration = q(3, "s")

local analysis = ledger.analyze({
    water_balance = balance,
    debris_mass = debris,
    wind = wind,
})
local counts = ledger.triage(analysis)
check(counts.available == 3, "Independent panels remain available")
check(counts.unavailable == 1, "Absent panel remains unavailable")
check(counts.external_action_authorized == false, "No authorization")

analysis.private_notes = "PRIVATE_SENTINEL"
local report, report_error = ledger.render_report(analysis)
check(report_error == nil, "Report should render")
check(not report:find("PRIVATE_SENTINEL", 1, true), "Private metadata omitted")
check(
    report:find("Actual-to-reference ET ratio: unavailable", 1, true) ~= nil,
    "Missing ratio remains visible"
)
check(
    report == ledger.render_report(analysis),
    "Repeated rendering must be stable in the same runtime"
)

local trapped = setmetatable({}, {
    __index = function()
        error("Metamethod must not run")
    end,
})
check(
    ledger.validate_quantity(trapped).state == "invalid",
    "Executable table behavior must be rejected"
)

print(string.format("FieldLedger: %d assertions passed.", passed))
