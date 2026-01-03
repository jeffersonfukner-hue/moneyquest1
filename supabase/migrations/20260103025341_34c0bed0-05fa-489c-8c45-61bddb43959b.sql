-- Reset incorrectly unlocked referral badges
-- Only unlock referral badges for users who actually have the required number of completed referrals

-- Reset Referral Bronze badge (requires 1+ completed referrals)
UPDATE badges 
SET is_unlocked = false, unlocked_at = null 
WHERE name ILIKE '%referral%bronze%' 
AND is_unlocked = true 
AND user_id NOT IN (
  SELECT referrer_id FROM referrals 
  WHERE status IN ('completed', 'rewarded')
  GROUP BY referrer_id 
  HAVING COUNT(*) >= 1
);

-- Reset Referral Silver badge (requires 5+ completed referrals)
UPDATE badges 
SET is_unlocked = false, unlocked_at = null 
WHERE name ILIKE '%referral%silver%' 
AND is_unlocked = true 
AND user_id NOT IN (
  SELECT referrer_id FROM referrals 
  WHERE status IN ('completed', 'rewarded')
  GROUP BY referrer_id 
  HAVING COUNT(*) >= 5
);

-- Reset Referral Gold badge (requires 10+ completed referrals)
UPDATE badges 
SET is_unlocked = false, unlocked_at = null 
WHERE name ILIKE '%referral%gold%' 
AND is_unlocked = true 
AND user_id NOT IN (
  SELECT referrer_id FROM referrals 
  WHERE status IN ('completed', 'rewarded')
  GROUP BY referrer_id 
  HAVING COUNT(*) >= 10
);