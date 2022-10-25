package jk.kamoru.flayground.flay.service;

import java.util.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;

public interface FlayArchiveService {

  Flay get(String opus);

  Page<Flay> page(Pageable pageable, String keyword);

  Collection<Flay> list();

  Collection<Flay> find(Search search);

  Collection<Flay> find(String query);

  Collection<Flay> find(String field, String value);

  void toInstance(String opus);

}
