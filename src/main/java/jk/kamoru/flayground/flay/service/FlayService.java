package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;

public interface FlayService {

	Flay get(String opus);

	Collection<Flay> list(); 
	
	Collection<Flay> find(Search search);

	Collection<Flay> find(String query);

	Collection<Flay> findByKeyValue(String field, String value);

	Collection<Flay> findCandidates();

	void acceptCandidates(String opus);

	void play(String opus);

	void edit(String opus);

	void rename(String opus, Flay flay);

	void openFolder(String folder);

}
