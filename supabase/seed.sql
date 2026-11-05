-- James: seed data — three towns, pipelines, agent roster, Batch Capital lender panel.
-- After running, add yourself as owner of each workspace:
--   insert into workspace_members (workspace_id, user_id)
--   select id, '<your auth user id>' from workspaces;

-- Towns
insert into workspaces (slug, name, town_name, vault_path) values
  ('batch-capital',   'Batch Capital',   'Capital City',  'vault/batch-capital'),
  ('batchout',        'BatchOut',        'Swipe Springs', 'vault/batchout'),
  ('batch-marketing', 'Batch Marketing', 'Billboard Bay', 'vault/batch-marketing');

-- Pipelines
insert into pipeline_stages (workspace_id, key, label, position, is_terminal)
select w.id, s.key, s.label, s.pos, s.term
from workspaces w
join (values
  ('batch-capital','new','New',1,false),
  ('batch-capital','contacted','Contacted',2,false),
  ('batch-capital','replied','Replied',3,false),
  ('batch-capital','app_in','App In',4,false),
  ('batch-capital','submitted','Submitted',5,false),
  ('batch-capital','approved','Approved',6,false),
  ('batch-capital','funded','Funded',7,true),
  ('batch-capital','dead','Dead',8,true),
  ('batchout','new','New',1,false),
  ('batchout','contacted','Contacted',2,false),
  ('batchout','statement_in','Statement In',3,false),
  ('batchout','proposal_sent','Proposal Sent',4,false),
  ('batchout','boarded','Boarded',5,true),
  ('batchout','dead','Dead',6,true),
  ('batch-marketing','new','New',1,false),
  ('batch-marketing','contacted','Contacted',2,false),
  ('batch-marketing','audit_sent','Audit Sent',3,false),
  ('batch-marketing','call','Call',4,false),
  ('batch-marketing','proposal_sent','Proposal Sent',5,false),
  ('batch-marketing','signed','Signed',6,true),
  ('batch-marketing','dead','Dead',7,true)
) as s(ws, key, label, pos, term) on s.ws = w.slug;

-- HQ-level agents
insert into agents (workspace_id, slug, name, character, role, enabled) values
  (null, 'james',     'James',     'The Voice',  'james',     false),
  (null, 'head-boss', 'Head Boss', 'The Mayor',  'head_boss', false),
  (null, 'inbox-clerk','Inbox Clerk','The Switchboard Operator','worker', false),
  (null, 'scribe',    'Scribe',    'The Town Historian', 'worker', false),
  (null, 'meeting-prep','Meeting Prep','The Butler', 'worker', false);

-- Town bosses
insert into agents (workspace_id, slug, name, character, role, enabled, boss_id)
select w.id, b.slug, b.name, b.ch, 'town_boss', false,
       (select id from agents where slug = 'head-boss' and workspace_id is null)
from workspaces w
join (values
  ('batch-capital','town-boss','Bank Manager','The Bank Manager'),
  ('batchout','town-boss','Diner Owner','The Diner Owner'),
  ('batch-marketing','town-boss','Station Manager','The Station Manager')
) as b(ws, slug, name, ch) on b.ws = w.slug;

-- Workers (phase-1 workers flagged in config)
insert into agents (workspace_id, slug, name, character, role, enabled, schedule_cron, config, boss_id)
select w.id, a.slug, a.name, a.ch, 'worker', false, a.cron, a.cfg::jsonb,
       (select id from agents b where b.workspace_id = w.id and b.slug = 'town-boss')
from workspaces w
join (values
  ('batch-capital','reddit-scout','Reddit Scout','The Paperboy','*/45 * * * *','{"phase":1}'),
  ('batch-capital','intake-clerk','Intake Clerk','The Receptionist',null,'{"phase":1,"trigger":"web_form"}'),
  ('batch-capital','observer','The Observer','The Neighbor at the Window','0 */2 * * *','{"phase":1,"read_only":true,"needs":"crm_access"}'),
  ('batch-capital','facebook-scout','Facebook Scout','The Gossip','0 9,13,17 * * *','{"phase":2}'),
  ('batch-capital','whatsapp-scout','WhatsApp Scout','The Ham Radio Operator','0 */3 * * *','{"phase":2,"needs":"scout_number"}'),
  ('batch-capital','gap-recruiter','Gap Recruiter','The Recruiter','0 10 * * 1','{"phase":2}'),
  ('batch-capital','compliance-cop','Compliance Cop','The Sheriff',null,'{"phase":2,"trigger":"draft_created"}'),
  ('batchout','cross-sell','Cross-Sell Agent','The Waitress',null,'{"phase":1,"trigger":"capital_lead"}'),
  ('batchout','statement-analyzer','Statement Analyzer','The Cashier',null,'{"phase":2}'),
  ('batchout','processor-fit','Processor Fit Tracker','The Mechanic','0 6 * * 1','{"phase":2}'),
  ('batchout','residual-tracker','Residual Tracker','The Accountant','0 7 1 * *','{"phase":2}'),
  ('batch-marketing','prospect-scout','Prospect Scout','The Door-to-Door Salesman','0 8 * * *','{"phase":3}'),
  ('batch-marketing','audit-builder','Audit Builder','The Printer',null,'{"phase":3}'),
  ('batch-marketing','proposal-writer','Proposal Writer','The Ad Man',null,'{"phase":3}'),
  ('batch-marketing','client-reporter','Client Reporter','The Newsman','0 8 1 * *','{"phase":3}'),
  ('batch-marketing','cross-sell','Cross-Sell Agent','The Billboard Painter',null,'{"phase":3}')
) as a(ws, slug, name, ch, cron, cfg) on a.ws = w.slug;

-- Lenders + segments: see seed_lenders.sql (generated from data/lender-parameters.json)

-- Starter Reddit watch list (to verify)
insert into sources (workspace_id, platform, identifier)
select w.id, 'reddit', s.sub from workspaces w
cross join (values ('r/smallbusiness'),('r/Entrepreneur'),('r/restaurantowners'),('r/Truckers'),
                   ('r/Construction'),('r/Accounting'),('r/tax'),('r/sweatystartup'),
                   ('r/smallbusinessfinance')) as s(sub)
where w.slug = 'batch-capital';
