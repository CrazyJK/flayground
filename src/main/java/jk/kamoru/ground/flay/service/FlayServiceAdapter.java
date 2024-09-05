package jk.kamoru.ground.flay.service;

import java.util.Collection;
import java.util.Comparator;

import org.apache.commons.lang3.StringUtils;

import jk.kamoru.ground.flay.FlayException;
import jk.kamoru.ground.flay.Search;
import jk.kamoru.ground.flay.domain.Flay;

public abstract class FlayServiceAdapter {

  protected Comparator<Flay> comparator = Comparator.comparing(Flay::getRelease).reversed().thenComparing(Comparator.comparing(Flay::getStudio).reversed().thenComparing(Comparator.comparing(Flay::getOpus).reversed()));

  protected Collection<Flay> findBySearch(Collection<Flay> list, Search search) {
    return list.stream().filter(f -> search.contains(f)).sorted(comparator).toList();
  }

  protected Collection<Flay> findByQuery(Collection<Flay> list, String query) {
    return list.stream().filter(f -> StringUtils.containsIgnoreCase(f.toQueryString(), query)).sorted(comparator).toList();
  }

  protected Collection<Flay> findByField(Collection<Flay> list, String key, String value) {
    if ("studio".equalsIgnoreCase(key)) {
      return list.stream().filter(f -> f.getStudio().equals(value)).sorted(comparator).toList();
    } else if ("title".equalsIgnoreCase(key)) {
      return list.stream().filter(f -> f.getTitle().contains(value)).sorted(comparator).toList();
    } else if ("actress".equalsIgnoreCase(key)) {
      return list.stream().filter(f -> f.getActressList().stream().anyMatch(a -> a.equals(value))).sorted(comparator).toList();
    } else if ("release".equalsIgnoreCase(key)) {
      return list.stream().filter(f -> f.getRelease().startsWith(value)).sorted(comparator).toList();
    } else if ("rank".equalsIgnoreCase(key)) {
      final int rank = Integer.parseInt(value);
      return list.stream().filter(f -> f.getVideo().getRank() == rank).sorted(comparator).toList();
    } else if ("play".equalsIgnoreCase(key)) {
      final int play = Integer.parseInt(value);
      return list.stream().filter(f -> f.getVideo().getPlay() == play).sorted(comparator).toList();
    } else if ("comment".equalsIgnoreCase(key)) {
      return list.stream().filter(f -> f.getVideo().getComment().contains(value)).sorted(comparator).toList();
    } else if ("tag".equalsIgnoreCase(key)) {
      final int id = Integer.parseInt(value);
      return list.stream().filter(f -> f.getVideo().getTags().stream().anyMatch(t -> t.getId().intValue() == id)).sorted(comparator).toList();
    } else {
      throw new FlayException("unknown key");
    }
  }

}
