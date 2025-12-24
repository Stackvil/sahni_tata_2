-- Add sales_phone and service_phone columns to showrooms table
ALTER TABLE showrooms 
ADD COLUMN IF NOT EXISTS sales_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS service_phone VARCHAR(50);

-- Update existing showrooms with phone numbers from JSON data
-- Vijayawada (id=1)
UPDATE showrooms 
SET sales_phone = '+91 93903 37788', 
    service_phone = '+91 93473 37788',
    phone = '+91 93903 37788'
WHERE city = 'Vijayawada' AND id = 1;

-- Guntur (id=2)
UPDATE showrooms 
SET sales_phone = '+91 92811 09383', 
    service_phone = '+91 92810 29455',
    phone = '+91 92811 09383'
WHERE city = 'Guntur' AND id = 2;

-- Narasaraopet (id=3)
UPDATE showrooms 
SET sales_phone = '+91 92811 09388', 
    service_phone = '+91 92810 29460',
    phone = '+91 92811 09388'
WHERE city = 'Narasaraopet' AND id = 3;

-- For other showrooms, set sales_phone and service_phone to phone if not already set
UPDATE showrooms 
SET sales_phone = COALESCE(sales_phone, phone),
    service_phone = COALESCE(service_phone, phone)
WHERE sales_phone IS NULL OR service_phone IS NULL;

