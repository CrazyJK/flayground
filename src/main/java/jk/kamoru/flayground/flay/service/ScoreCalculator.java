package jk.kamoru.flayground.flay.service;

import jk.kamoru.flayground.flay.domain.Flay;

public class ScoreCalculator {

	private static final int RANK_POINT = 20;
	private static final int PLAY_POINT = 1;
	private static final int SUBTITLES_POINT = 50;
	
	public static int calc(Flay flay) {
		return flay.getVideo().getRank() * RANK_POINT 
				+ flay.getVideo().getPlay() * PLAY_POINT 
				+ flay.getFiles().get(Flay.SUBTI).size() * SUBTITLES_POINT;
	}

	public static int compare(Flay flay1, Flay flay2) {
		int s1 = calc(flay1);
		int s2 = calc(flay2);
		if (s1 == s2) {
            return 0;
        }
        return s1 < s2 ? -1 : 1;
	}
}
