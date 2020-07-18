package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jk.kamoru.flayground.flay.domain.Flay;

public interface FlayArchiveService {

	Flay get(String opus);

	Page<Flay> page(Pageable pageable, String keyword);

	Collection<Flay> list();

	void toInstance(String opus);

	List<Flay> find(String key, String value);

}
