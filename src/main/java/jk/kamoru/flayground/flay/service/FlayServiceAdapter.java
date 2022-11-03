package jk.kamoru.flayground.flay.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import org.apache.commons.lang3.RandomUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class FlayServiceAdapter {

  protected Comparator<Flay> comparator =
      Comparator.comparing(Flay::getRelease).reversed()
          .thenComparing(Comparator.comparing(Flay::getStudio).reversed()
              .thenComparing(Comparator.comparing(Flay::getOpus).reversed()));

  protected Collection<Flay> findBySearch(Collection<Flay> list, Search search) {
    return list.stream()
        .filter(f -> search.contains(f))
        .sorted(comparator)
        .toList();
  }

  protected Collection<Flay> findByQuery(Collection<Flay> list, String query) {
    return list.stream()
        .filter(f -> StringUtils.containsIgnoreCase(f.toQueryString(), query))
        .sorted(comparator)
        .toList();
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
      throw new IllegalStateException("unknown key");
    }
  }

  protected Page<Flay> page(Collection<Flay> list, Pageable pageable, String keyword) {
    List<Flay> foundList = new ArrayList<>();
    if ("RANDOM".equals(keyword)) {
      foundList.add(new ArrayList<Flay>(list).get(RandomUtils.nextInt(0, list.size())));
    } else {
      foundList = list.stream()
          .filter(f -> StringUtils.containsIgnoreCase(f.toQueryString(), keyword))
          .sorted(comparator)
          .toList();
    }
    final long skip = pageable.getPageNumber() * pageable.getPageSize();
    final long limit = pageable.getPageSize();
    log.debug("[page] total found: {}, skip: {}, limit {}", foundList.size(), skip, limit);

    return new PageImpl<>(foundList.stream().skip(skip).limit(limit).toList(), pageable, foundList.size());
  }

}
