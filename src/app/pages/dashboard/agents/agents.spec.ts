import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { Agents } from './agents';

describe('Agents', () => {
  let component: Agents;
  let fixture: ComponentFixture<Agents>;
  let mockMeta: jasmine.SpyObj<Meta>;
  let mockTitle: jasmine.SpyObj<Title>;

  beforeEach(async () => {
    const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [Agents],
      providers: [
        { provide: Meta, useValue: metaSpy },
        { provide: Title, useValue: titleSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Agents);
    component = fixture.componentInstance;
    mockMeta = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    mockTitle = TestBed.inject(Title) as jasmine.SpyObj<Title>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct agents data', () => {
    expect(component.agents().length).toBe(3);
    expect(component.totalAgents()).toBe(3);
  });

  it('should identify center agent correctly', () => {
    const centerAgent = component.centerAgent();
    expect(centerAgent).toBeDefined();
    expect(centerAgent?.isCenter).toBe(true);
    expect(centerAgent?.name).toBe('Oasis Grace Oman');
  });

  it('should filter side agents correctly', () => {
    const sideAgents = component.sideAgents();
    expect(sideAgents.length).toBe(2);
    expect(sideAgents.every(agent => !agent.isCenter)).toBe(true);
  });

  it('should setup page metadata on init', () => {
    expect(mockTitle.setTitle).toHaveBeenCalledWith('Trusted Agents - JMR Real Estate');
    expect(mockMeta.updateTag).toHaveBeenCalledTimes(5); // description, keywords, og:title, og:description, og:type
  });

  it('should handle social link clicks', () => {
    spyOn(console, 'log');
    const agent = component.agents()[0];
    
    component.onSocialLinkClick(agent, 'facebook');
    
    expect(console.log).toHaveBeenCalledWith(`Social link clicked: ${agent.name} - facebook`);
  });

  it('should handle agent card clicks', () => {
    spyOn(console, 'log');
    const agent = component.agents()[0];
    
    component.onAgentCardClick(agent);
    
    expect(console.log).toHaveBeenCalledWith(`Agent card clicked: ${agent.name}`);
  });

  it('should have correct page metadata computed values', () => {
    const metadata = component.pageMetadata();
    
    expect(metadata.title).toBe('Trusted Agents - JMR Real Estate');
    expect(metadata.description).toContain('trusted team of real estate agents');
    expect(metadata.keywords).toContain('trusted agents');
  });
});
