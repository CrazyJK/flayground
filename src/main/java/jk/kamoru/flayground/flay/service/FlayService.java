package jk.kamoru.flayground.flay.service;

import java.util.Collection;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;

public interface FlayService {

  Flay get(String opus);

  Collection<Flay> list();

  Collection<Flay> listOrderbyScoreDesc();

  Collection<Flay> listOfLowScore();

  Collection<Flay> find(Search search);

  Collection<Flay> find(String query);

  Collection<Flay> find(String field, String value);

  Collection<Flay> findByTagLike(Integer id);

  Collection<Flay> findCandidates();

  void acceptCandidates(String opus);

  void play(String opus);

  void edit(String opus);

  void rename(String opus, Flay flay);

  void openFolder(String folder);

  void deleteFile(String file);

  void deleteFileOnFlay(String opus, String file);

}
