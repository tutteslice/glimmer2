
import { Smile, Zap, Heart, Shield, CloudRain, AlertCircle, Frown, Flame } from 'lucide-react';
import { Emotion, FeelingType } from './types';

export const EMOTION_CONFIG: Record<Emotion, { type: FeelingType, icon: any }> = {
  // Positive
  HAPPY: { type: FeelingType.POSITIVE, icon: Smile },
  EXCITED: { type: FeelingType.POSITIVE, icon: Zap },
  GRATEFUL: { type: FeelingType.POSITIVE, icon: Heart },
  CALM: { type: FeelingType.POSITIVE, icon: Shield },
  
  // Negative
  SAD: { type: FeelingType.NEGATIVE, icon: CloudRain },
  ANGRY: { type: FeelingType.NEGATIVE, icon: AlertCircle },
  ANXIOUS: { type: FeelingType.NEGATIVE, icon: AlertCircle },
  FRUSTRATED: { type: FeelingType.NEGATIVE, icon: Frown },

  // Sexual
  AROUSED: { type: FeelingType.SEXUAL, icon: Flame },
  LUSTFUL: { type: FeelingType.SEXUAL, icon: Flame },
  INTIMATE: { type: FeelingType.SEXUAL, icon: Heart },
  PASSIONATE: { type: FeelingType.SEXUAL, icon: Zap },
};
