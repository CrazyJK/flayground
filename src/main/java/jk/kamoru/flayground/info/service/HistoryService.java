package jk.kamoru.flayground.info.service;

import java.util.List;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.domain.History.Action;

public interface HistoryService {

	List<History> find(String query);

	void persist(History history);

	void save(Action play, Flay flay);

}
