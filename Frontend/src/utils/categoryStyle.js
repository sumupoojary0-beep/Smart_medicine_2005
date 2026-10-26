/** Icon + colour for a medicine category (used by cards, tiles and lists). */
import {
  HiOutlineHeart, HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineEye, HiOutlineBeaker,
} from 'react-icons/hi2'
import { MdMedication, MdPsychology, MdOutlineAir, MdHealing, MdBloodtype } from 'react-icons/md'

const TONES = {
  green: { tile: 'bg-primary-100 text-primary-700', dot: 'bg-primary-500' },
  blue:  { tile: 'bg-secondary-100 text-secondary-700', dot: 'bg-secondary-500' },
  amber: { tile: 'bg-accent-100 text-accent-800', dot: 'bg-accent-500' },
  rose:  { tile: 'bg-danger-100 text-danger-700', dot: 'bg-danger-500' },
  slate: { tile: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

const RULES = [
  [/cardio|cvs|heart|hypertens/i,            HiOutlineHeart,       'rose'],
  [/central nerv|cns|neuro|psych/i,          MdPsychology,         'blue'],
  [/infect|antibio|antiviral|antifung|malar/i, HiOutlineShieldCheck, 'green'],
  [/respir|asthma|cough|cold/i,              MdOutlineAir,         'blue'],
  [/diabet|endocrin|hormon/i,                MdBloodtype,          'amber'],
  [/vitamin|mineral|nutri|supplement/i,      HiOutlineSparkles,    'amber'],
  [/eye|ophthal|ear/i,                       HiOutlineEye,         'blue'],
  [/consumable|surgical|dressing|bandage/i,  MdHealing,            'slate'],
  [/gastro|git|stomach|antacid|ulcer/i,      HiOutlineBeaker,      'green'],
]

export function categoryStyle(name = '') {
  for (const [re, Icon, tone] of RULES) {
    if (re.test(name)) return { Icon, ...TONES[tone] }
  }
  return { Icon: MdMedication, ...TONES.green }
}