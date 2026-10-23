-- SPDX-License-Identifier: MIT OR Apache-2.0
-- FieldLedger: local environmental evidence calculations.
--
-- Require as:
--   local ledger = require("fieldledger")
--
-- Quantity contract:
--   { state="available", value=12, unit="mm",
--     lower=10, upper=14 }
--   { state="unavailable", reason="Not measured" }
--
-- Bounds are optional, paired, inclusive enclosing bounds.
-- They are not confidence intervals or probability statements.
--
-- Expected application data is plain Lua tables, not executable objects.
-- This module performs no I/O and never authorizes external action.

local M = {
    VERSION = "1.0.0",
    LICENSE = "MIT OR Apache-2.0",
}

local rawget, getmetatable = rawget, getmetatable
local huge = math.huge

local function plain(value)
    return type(value) == "table" and getmetatable(value) == nil
end

local function field(value, key)
    if plain(value) then
        return rawget(value, key)
    end
    return nil
end

local function text(value)
    return type(value) == "string" and value:find("%S") ~= nil
end

local function issue(code, message)
    return { code = code, message = message }
end

local function invalid(code, message)
    return {
        state = "invalid",
        issues = { issue(code, message) },
        external_action_authorized = false,
    }
end

local function unavailable(reason)
    return {
        state = "unavailable",
        reason = reason,
        external_action_authorized = false,
    }
end

local function missing(label)
    return unavailable(label .. " is unavailable.")
end

function M.is_finite(value)
    return type(value) == "number"
        and value == value
        and value ~= huge
        and value ~= -huge
end

function M.unavailable(reason)
    if not text(reason) or #reason > 500 then
        return invalid("reason", "Provide a nonblank reason up to 500 bytes.")
    end
    return unavailable(reason)
end

function M.quantity(value, unit, lower, upper)
    return M.validate_quantity({
        state = "available",
        value = value,
        unit = unit,
        lower = lower,
        upper = upper,
    })
end

--- Validate and copy a quantity without changing the supplied table.
--- options: unit, minimum, maximum.
function M.validate_quantity(input, options)
    if not plain(input) then
        return invalid("quantity", "Expected a plain quantity table.")
    end
    if options ~= nil and not plain(options) then
        return invalid("options", "Expected a plain options table.")
    end
    options = options or {}

    local minimum = rawget(options, "minimum")
    local maximum = rawget(options, "maximum")
    local expected_unit = rawget(options, "unit")

    if minimum ~= nil and not M.is_finite(minimum) then
        return invalid("minimum", "Minimum must be finite.")
    end
    if maximum ~= nil and not M.is_finite(maximum) then
        return invalid("maximum", "Maximum must be finite.")
    end
    if minimum and maximum and minimum > maximum then
        return invalid("range", "Minimum exceeds maximum.")
    end
    if expected_unit ~= nil and not text(expected_unit) then
        return invalid("unit", "Expected unit must be nonblank.")
    end

    local state = rawget(input, "state")
    if state == "unavailable" then
        return M.unavailable(rawget(input, "reason"))
    end
    if state ~= "available" then
        return invalid("state", "Expected available or unavailable.")
    end

    local value = rawget(input, "value")
    local unit = rawget(input, "unit")
    local lower = rawget(input, "lower")
    local upper = rawget(input, "upper")

    if not M.is_finite(value) then
        return invalid("value", "Value must be a finite number.")
    end
    if not text(unit) or #unit > 64 then
        return invalid("unit", "Unit must be nonblank and at most 64 bytes.")
    end
    if expected_unit and unit ~= expected_unit then
        return invalid("unit", "Quantity unit does not match the contract.")
    end
    if (lower == nil) ~= (upper == nil) then
        return invalid("bounds", "Supply both bounds or neither.")
    end
    if lower ~= nil then
        if not M.is_finite(lower) or not M.is_finite(upper) then
            return invalid("bounds", "Bounds must be finite.")
        end
        if lower > value or upper < value then
            return invalid("bounds", "Bounds must enclose the value.")
        end
    end

    local lo, hi = lower or value, upper or value
    if minimum ~= nil and lo < minimum then
        return invalid("range", "Value or lower bound is below minimum.")
    end
    if maximum ~= nil and hi > maximum then
        return invalid("range", "Value or upper bound exceeds maximum.")
    end

    return {
        state = "available",
        value = value,
        unit = unit,
        lower = lower,
        upper = upper,
        uncertainty = lower ~= nil and "bounded" or "unavailable",
        external_action_authorized = false,
    }
end

local function derive(value, unit, lower, upper, evidence_class)
    local result = M.quantity(value, unit, lower, upper)
    if result.state == "available" then
        result.evidence_class = evidence_class
    end
    return result
end

local function validated(input, key, options)
    local value = field(input, key)
    if value == nil then
        return missing(key)
    end
    return M.validate_quantity(value, options)
end

--- Shared support contract: opaque local labels, not public coordinates.
--- Matching labels are caller assertions, not verified compatibility.
function M.check_support(input)
    if not plain(input) then
        return invalid("support", "Expected a plain support table.")
    end
    for _, key in ipairs({ "period", "spatial_support", "method" }) do
        local value = rawget(input, key)
        if not text(value) or #value > 200 then
            return invalid("support", "Support fields must be nonblank labels.")
        end
    end
    if rawget(input, "compatibility_reviewed") ~= true then
        return missing("Compatibility review")
    end
    return {
        state = "available",
        external_action_authorized = false,
    }
end

--- input: actual, reference, support, minimum_reference.
--- Both ET inputs are accumulated mm over the declared shared support.
function M.validate_ratio(input)
    if not plain(input) then
        return invalid("input", "Expected a ratio input table.")
    end

    local actual = validated(input, "actual", { unit = "mm", minimum = 0 })
    local reference = validated(input, "reference", { unit = "mm", minimum = 0 })
    for _, q in ipairs({ actual, reference }) do
        if q.state ~= "available" then return q end
    end

    local support = M.check_support(field(input, "support"))
    if support.state ~= "available" then return support end

    local threshold = rawget(input, "minimum_reference")
    if not M.is_finite(threshold) or threshold <= 0 then
        return invalid("threshold", "A positive reference threshold is required.")
    end
    if reference.value < threshold
        or (reference.lower and reference.lower < threshold) then
        return missing("Reference ET above the declared threshold")
    end

    local lower, upper
    if actual.lower ~= nil and reference.lower ~= nil then
        lower = actual.lower / reference.upper
        upper = actual.upper / reference.lower
    end

    local result = derive(
        actual.value / reference.value,
        "1", lower, upper, "comparison"
    )
    if result.state == "available" then
        result.metric = "actual_to_reference_et_ratio"
    end
    return result
end

local balance_terms = {
    { "precipitation", 1 },
    { "irrigation", 1 },
    { "lateral_inflow", 1 },
    { "groundwater_inflow", 1 },
    { "actual_et", -1 },
    { "surface_outflow", -1 },
    { "drainage_outflow", -1 },
    { "groundwater_outflow", -1 },
    { "storage_change", -1 },
}

--- Every balance term is required; known zero must be explicitly supplied.
--- residual = inputs - outputs - observed storage change.
function M.check_water_balance(input)
    if not plain(input) then
        return invalid("input", "Expected a water-balance input table.")
    end
    local tolerance = rawget(input, "tolerance_mm")
    if not M.is_finite(tolerance) or tolerance < 0 then
        return invalid("tolerance", "Supply a finite nonnegative tolerance.")
    end
    local support = M.check_support(field(input, "support"))
    if support.state ~= "available" then return support end
    if rawget(input, "boundaries_reviewed") ~= true then
        return missing("Non-overlapping water-balance boundary review")
    end

    local value, lower, upper = 0, 0, 0
    local all_bounded = true

    for _, entry in ipairs(balance_terms) do
        local name, sign = entry[1], entry[2]
        local q = validated(input, name, { unit = "mm" })
        if q.state ~= "available" then return q end
        value = value + sign * q.value

        if q.lower == nil then
            all_bounded = false
        elseif sign == 1 then
            lower, upper = lower + q.lower, upper + q.upper
        else
            lower, upper = lower - q.upper, upper - q.lower
        end
    end

    if not all_bounded then lower, upper = nil, nil end
    local result = derive(value, "mm", lower, upper, "comparison")
    if result.state ~= "available" then return result end

    result.metric = "water_balance_residual"
    result.central_within_tolerance = math.abs(value) <= tolerance
    if all_bounded then
        if lower >= -tolerance and upper <= tolerance then
            result.assessment = "entire_interval_within_tolerance"
        elseif upper < -tolerance or lower > tolerance then
            result.assessment = "entire_interval_outside_tolerance"
        else
            result.assessment = "interval_overlaps_tolerance_boundary"
        end
    else
        result.assessment = "central_value_only_uncertainty_unavailable"
    end
    return result
end

local materials = {
    vegetative = true,
    construction = true,
    mixed = true,
    uncertain = true,
}

local volume_bases = {
    loose_pile = true,
    compacted = true,
    solid_material = true,
}

--- Density must use the same material and volume basis as the volume.
function M.estimate_debris_mass(input)
    if not plain(input) then
        return invalid("input", "Expected a debris input table.")
    end

    local volume = validated(input, "volume", { unit = "m3", minimum = 0 })
    local density = validated(input, "density", { unit = "kg/m3", minimum = 0 })
    for _, q in ipairs({ volume, density }) do
        if q.state ~= "available" then return q end
    end
    if density.value <= 0 or (density.lower and density.lower <= 0) then
        return invalid("density", "Density and its bounds must be positive.")
    end

    local material = rawget(input, "material")
    local basis = rawget(input, "volume_basis")
    if not materials[material] or not volume_bases[basis] then
        return invalid("basis", "Declare supported material and volume bases.")
    end
    if rawget(input, "density_material") ~= material
        or rawget(input, "density_volume_basis") ~= basis then
        return invalid("basis", "Volume and density bases do not match.")
    end
    if rawget(input, "density_applicability_reviewed") ~= true then
        return missing("Density applicability review")
    end

    local lower, upper
    if volume.lower ~= nil and density.lower ~= nil then
        lower = volume.lower * density.lower
        upper = volume.upper * density.upper
    end

    local result = derive(
        volume.value * density.value, "kg", lower, upper, "estimated"
    )
    if result.state == "available" then
        result.metric = "estimated_debris_mass"
        result.material = material
        result.warning = material == "mixed" or material == "uncertain"
        result.measured_mass = false
    end
    return result
end

--- Validate a gust record without inferring storm type or damage cause.
function M.validate_wind(input)
    if not plain(input) then
        return invalid("input", "Expected a wind input table.")
    end
    local gust = validated(input, "gust", { unit = "m/s", minimum = 0 })
    local height = validated(input, "height", { unit = "m", minimum = 0 })
    local duration = validated(input, "gust_duration", { unit = "s", minimum = 0 })

    for _, q in ipairs({ gust, height, duration }) do
        if q.state ~= "available" then return q end
    end
    if height.value <= 0 or duration.value <= 0
        or (height.lower and height.lower <= 0)
        or (duration.lower and duration.lower <= 0) then
        return invalid("wind", "Height and gust duration must be positive.")
    end
    if rawget(input, "exposure_reviewed") ~= true then
        return missing("Wind exposure review")
    end
    if rawget(input, "event_coverage_reviewed") ~= true then
        return missing("Wind event coverage review")
    end

    local result = derive(
        gust.value, "m/s", gust.lower, gust.upper, "observed"
    )
    if result.state == "available" then
        result.metric = "surface_gust"
        result.causal_attribution = "not_assessed"
    end
    return result
end

--- Independent calculations: one invalid panel does not erase the others.
function M.analyze(input)
    if not plain(input) then
        return invalid("input", "Expected a plain workbench input table.")
    end
    local result = {
        version = M.VERSION,
        external_action_authorized = false,
    }
    local jobs = {
        { "ratio", M.validate_ratio },
        { "water_balance", M.check_water_balance },
        { "debris_mass", M.estimate_debris_mass },
        { "wind", M.validate_wind },
    }
    for _, job in ipairs(jobs) do
        local payload = rawget(input, job[1])
        result[job[1]] = payload == nil
            and missing(job[1]) or job[2](payload)
    end
    return result
end

function M.triage(analysis)
    if not plain(analysis) then
        return invalid("analysis", "Expected a plain analysis table.")
    end
    local counts = { available = 0, unavailable = 0, invalid = 0 }
    for _, key in ipairs({ "ratio", "water_balance", "debris_mass", "wind" }) do
        local state = field(field(analysis, key), "state")
        if state ~= "available" and state ~= "unavailable" then
            state = "invalid"
        end
        counts[state] = counts[state] + 1
    end
    counts.review_state = counts.invalid > 0 and "input_review_required"
        or "scientific_review_required"
    counts.external_action_authorized = false
    return counts
end

local function number(value)
    return string.format("%.10g", value)
end

--- Renders only fixed labels and validated numerical output.
--- Raw reasons, source text, coordinates, and arbitrary metadata are omitted.
function M.render_report(analysis)
    local counts = M.triage(analysis)
    if counts.state == "invalid" then return nil, counts end

    local lines = {
        "FieldLedger evidence report",
        "Review: " .. counts.review_state,
        "External action authorized: no",
        "Bounds are enclosing intervals, not confidence statements.",
        "Uncertainty unavailable does not mean zero uncertainty.",
        "Compatibility and applicability reviews are caller assertions.",
        "",
    }

    local labels = {
        { "ratio", "Actual-to-reference ET ratio", "1", "comparison" },
        { "water_balance", "Water-balance residual", "mm", "comparison" },
        { "debris_mass", "Estimated debris mass", "kg", "estimated" },
        { "wind", "Surface gust", "m/s", "observed" },
    }

    for _, item in ipairs(labels) do
        local q = field(analysis, item[1])
        local checked = M.validate_quantity(q, { unit = item[3] })
        local prefix = item[2] .. ": "

        if checked.state == "available"
            and field(q, "evidence_class") == item[4] then
            lines[#lines + 1] = prefix .. number(checked.value)
                .. " " .. checked.unit .. " [" .. item[4] .. "]"
            if checked.lower ~= nil then
                lines[#lines + 1] = "  Bounds: "
                    .. number(checked.lower) .. " to " .. number(checked.upper)
            else
                lines[#lines + 1] = "  Uncertainty: unavailable"
            end
        elseif checked.state == "unavailable" then
            lines[#lines + 1] = prefix .. "unavailable"
        else
            lines[#lines + 1] = prefix .. "invalid; inspect structured diagnostics"
        end
    end

    lines[#lines + 1] = ""
    lines[#lines + 1] = "No health, safety, restoration-success, or disposal approval."
    lines[#lines + 1] = "No raw inputs or private metadata included."
    return table.concat(lines, "\n")
end

return M
