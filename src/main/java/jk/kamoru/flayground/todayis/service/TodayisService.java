package jk.kamoru.flayground.todayis.service;

import java.util.Collection;

import jk.kamoru.flayground.todayis.domain.Todayis;

public interface TodayisService {

	Collection<Todayis> list();

	void play(Todayis todayis);

	void delete(Todayis todayis);

}
