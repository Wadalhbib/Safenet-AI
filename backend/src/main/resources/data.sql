-- SafeNet AI - Malaysian Scam Domain Seed Data
-- Runs on startup via spring.sql.init.mode=always

-- LHDN / Hasil (Tax Authority) Clones
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('lhdn-refund.xyz',        'LHDN Clone',     'Fake LHDN tax refund portal collecting IC and banking info', 'CRITICAL', 1),
('hasil-gov-my.top',       'LHDN Clone',     'Typosquat of hasil.gov.my phishing credentials', 'CRITICAL', 1),
('lhdn-bayaran.click',     'LHDN Clone',     'Fake LHDN payment portal', 'HIGH', 1),
('hasilnet-login.tk',      'LHDN Clone',     'Fake HASiL login harvesting MyKad details', 'CRITICAL', 1),
('lhdn-semak.ml',          'LHDN Clone',     'Fake LHDN status check portal', 'HIGH', 1);

-- KWSP / EPF (Pension Fund) Clones
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('kwsp-withdrawal.click',  'KWSP Clone',     'Fake EPF i-Sinar withdrawal scam', 'CRITICAL', 1),
('epf-ebulletin.tk',       'KWSP Clone',     'Phishing EPF login page stealing savings credentials', 'CRITICAL', 1),
('kwsp-akaun.xyz',         'KWSP Clone',     'Fake KWSP account portal', 'HIGH', 1),
('myepf-pengeluaran.ml',   'KWSP Clone',     'Fake EPF withdrawal approval page', 'CRITICAL', 1);

-- Pos Malaysia / Parcel Delivery Scams
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('poslaju-track.ml',       'Pos Malaysia Clone', 'Fake parcel tracking requiring payment to release package', 'HIGH', 1),
('pos-malaysia-deliver.tk','Pos Malaysia Clone', 'SMS phishing parcel scam redirector', 'HIGH', 1),
('poslaju-semak.xyz',      'Pos Malaysia Clone', 'Fake Pos Laju tracking with credential harvesting', 'MEDIUM', 1);

-- E-Commerce / Shopping Scams
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('shopee-lucky-draw.ga',   'Shopee Scam',    'Fake Shopee 11.11 lucky draw collecting payment details', 'HIGH', 1),
('shopee-promo-my.cf',     'Shopee Scam',    'Fake Shopee promo page with malware download', 'CRITICAL', 1),
('lazada-win.tk',          'Lazada Scam',    'Fake Lazada winner notification phishing site', 'HIGH', 1),
('grab-reward.xyz',        'Grab Scam',      'Fake GrabFood reward claiming page', 'MEDIUM', 1);

-- Banking Phishing
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('maybank-secure.cf',      'Banking Scam',   'Fake Maybank2u login page harvesting TAC codes', 'CRITICAL', 1),
('cimb-verify.xyz',        'Banking Scam',   'CIMB Clicks credential harvester', 'CRITICAL', 1),
('rhb-online-my.tk',       'Banking Scam',   'Fake RHB Now banking portal', 'CRITICAL', 1),
('publicbank-login.ml',    'Banking Scam',   'Fake Public Bank login phishing', 'CRITICAL', 1),
('hlb-connect.click',      'Banking Scam',   'Fake Hong Leong Connect portal', 'HIGH', 1);

-- Government Services Scams
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('jpj-renew.xyz',          'JPJ Clone',      'Fake JPJ road tax renewal collecting payment', 'HIGH', 1),
('mysej-hahtera.ml',       'MySejahtera Clone','Fake MySejahtera health app login', 'HIGH', 1),
('myeg-renew.click',       'MyEG Clone',     'Fake MyEG renewal portal', 'MEDIUM', 1),
('jpa-scholarship.tk',     'JPA Clone',      'Fake JPA scholarship application harvesting student data', 'HIGH', 1);

-- Cryptocurrency / Investment Scams
INSERT OR IGNORE INTO blacklist_domains (domain, category, description, threat_level, active) VALUES
('malaysia-crypto-win.xyz','Crypto Scam',    'Fake crypto investment promising guaranteed returns', 'CRITICAL', 1),
('bitcash-my.click',       'Crypto Scam',    'Pig-butchering crypto romance scam platform', 'CRITICAL', 1),
('investasi-emas-my.tk',   'Investment Scam','Fake gold investment Ponzi scheme', 'CRITICAL', 1);
