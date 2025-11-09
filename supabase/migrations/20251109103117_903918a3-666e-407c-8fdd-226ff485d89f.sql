-- Create enum for unit categories
CREATE TYPE public.unit_category AS ENUM ('weight', 'volume', 'length', 'count', 'area', 'other');

-- Create units table
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  category unit_category NOT NULL,
  is_base_unit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(abbreviation)
);

-- Create unit conversions table
CREATE TABLE public.unit_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  to_unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  conversion_factor DECIMAL(20, 6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_unit_id, to_unit_id)
);

-- Add unit_id to items table
ALTER TABLE public.items ADD COLUMN unit_id UUID REFERENCES public.units(id);

-- Enable RLS
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for units
CREATE POLICY "Anyone can view units"
  ON public.units FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can create units"
  ON public.units FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update units"
  ON public.units FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Only admins can delete units"
  ON public.units FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for unit conversions
CREATE POLICY "Anyone can view conversions"
  ON public.unit_conversions FOR SELECT
  USING (true);

CREATE POLICY "Admins and managers can create conversions"
  ON public.unit_conversions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update conversions"
  ON public.unit_conversions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Only admins can delete conversions"
  ON public.unit_conversions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert common units
INSERT INTO public.units (name, abbreviation, category, is_base_unit) VALUES
  -- Count
  ('Piece', 'pc', 'count', true),
  ('Box', 'box', 'count', false),
  ('Dozen', 'doz', 'count', false),
  ('Pack', 'pack', 'count', false),
  -- Weight
  ('Gram', 'g', 'weight', true),
  ('Kilogram', 'kg', 'weight', false),
  ('Milligram', 'mg', 'weight', false),
  ('Ton', 't', 'weight', false),
  ('Pound', 'lb', 'weight', false),
  ('Ounce', 'oz', 'weight', false),
  -- Volume
  ('Milliliter', 'ml', 'volume', true),
  ('Liter', 'l', 'volume', false),
  ('Gallon', 'gal', 'volume', false),
  ('Fluid Ounce', 'fl oz', 'volume', false),
  -- Length
  ('Meter', 'm', 'length', true),
  ('Centimeter', 'cm', 'length', false),
  ('Kilometer', 'km', 'length', false),
  ('Inch', 'in', 'length', false),
  ('Foot', 'ft', 'length', false),
  -- Area
  ('Square Meter', 'm²', 'area', true),
  ('Square Foot', 'ft²', 'area', false);

-- Insert common conversions (using variable references for clarity in practice)
-- Weight conversions
INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'kg'),
  (SELECT id FROM public.units WHERE abbreviation = 'g'),
  1000;

INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'g'),
  (SELECT id FROM public.units WHERE abbreviation = 'mg'),
  1000;

INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 't'),
  (SELECT id FROM public.units WHERE abbreviation = 'kg'),
  1000;

INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'lb'),
  (SELECT id FROM public.units WHERE abbreviation = 'oz'),
  16;

-- Volume conversions
INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'l'),
  (SELECT id FROM public.units WHERE abbreviation = 'ml'),
  1000;

INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'gal'),
  (SELECT id FROM public.units WHERE abbreviation = 'fl oz'),
  128;

-- Length conversions
INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'km'),
  (SELECT id FROM public.units WHERE abbreviation = 'm'),
  1000;

INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'm'),
  (SELECT id FROM public.units WHERE abbreviation = 'cm'),
  100;

INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'ft'),
  (SELECT id FROM public.units WHERE abbreviation = 'in'),
  12;

-- Count conversions
INSERT INTO public.unit_conversions (from_unit_id, to_unit_id, conversion_factor)
SELECT 
  (SELECT id FROM public.units WHERE abbreviation = 'doz'),
  (SELECT id FROM public.units WHERE abbreviation = 'pc'),
  12;