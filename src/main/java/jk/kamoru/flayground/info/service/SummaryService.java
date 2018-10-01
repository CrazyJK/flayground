package jk.kamoru.flayground.info.service;

import java.util.List;
import java.util.Map;

import jk.kamoru.flayground.flay.domain.Flay;

public interface SummaryService {

	Map<String, List<Flay>> groupByRelease(String string);

}
