package jk.kamoru.flayground.info.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Studio;

@Service
public class StudioInfoService extends InfoServiceAdapter<Studio, String> {

	@Autowired FlayService flayService;

	public Studio findOneByOpus(Search search) {
		// TODO
		return null;
	}
}
